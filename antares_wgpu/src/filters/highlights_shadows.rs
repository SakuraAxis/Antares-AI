use crate::gpu;

/// Apply highlights/shadows filter using GPU compute shader ( OKLab color space ).
pub async fn apply_highlights_shadows(
    data: &mut [u8],
    width: u32,
    height: u32,
    amount: f32,
) -> Result<(), String> {
    let (device, queue, hs) = gpu::with_gpu_state(|s| {
        (
            s.device.clone(),
            s.queue.clone(),
            s.highlights_shadows.clone(),
        )
    })?;
    let owned = data.to_vec();
    let result = hs
        .apply(&device, &queue, owned, width, height, amount)
        .await?;
    data.copy_from_slice(&result);
    Ok(())
}
