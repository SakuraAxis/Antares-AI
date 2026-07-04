use crate::gpu;

/// Apply brightness filter using GPU compute shader ( OKLab lightness ).
pub async fn apply_brightness(
    data: &mut [u8],
    width: u32,
    height: u32,
    amount: f32,
) -> Result<(), String> {
    let (device, queue, brightness) =
        gpu::with_gpu_state(|s| (s.device.clone(), s.queue.clone(), s.brightness.clone()))?;
    let owned = data.to_vec();
    let result = brightness
        .apply(&device, &queue, owned, width, height, amount)
        .await?;
    data.copy_from_slice(&result);
    Ok(())
}
