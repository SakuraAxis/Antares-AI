use crate::gpu;

/// Apply temperature and tint filter using GPU compute shader ( OKLab color space ).
pub async fn apply_temperature_tint(
    data: &mut [u8],
    width: u32,
    height: u32,
    temperature: f32,
    tint: f32,
) -> Result<(), String> {
    let (device, queue, tt) = gpu::with_gpu_state(|s| {
        (
            s.device.clone(),
            s.queue.clone(),
            s.temperature_tint.clone(),
        )
    })?;
    let owned = data.to_vec();
    let result = tt
        .apply(&device, &queue, owned, width, height, temperature, tint)
        .await?;
    data.copy_from_slice(&result);
    Ok(())
}
