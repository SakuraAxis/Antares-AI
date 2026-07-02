use crate::gpu;

/// Apply vibrance filter using GPU compute shader ( OKLCH color space ).
pub async fn apply_vibrance(
    data: &mut [u8],
    width: u32,
    height: u32,
    amount: f32,
) -> Result<(), String> {
    let (device, queue, vibrance) =
        gpu::with_gpu_state(|s| (s.device.clone(), s.queue.clone(), s.vibrance.clone()))?;
    let owned = data.to_vec();
    let result = vibrance
        .apply(&device, &queue, owned, width, height, amount)
        .await?;
    data.copy_from_slice(&result);
    Ok(())
}
