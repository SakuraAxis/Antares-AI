mod vibrance;
mod highlights_shadows;

use std::cell::RefCell;

pub use vibrance::VibrancePipeline;
pub use highlights_shadows::HighlightsShadowsPipeline;

thread_local! {
    static GPU_STATE: RefCell<Option<GpuState>> = const { RefCell::new(None) };
}

pub struct GpuState {
    pub device: wgpu::Device,
    pub queue: wgpu::Queue,
    pub vibrance: VibrancePipeline,
    pub highlights_shadows: HighlightsShadowsPipeline,
}


pub async fn init() -> Result<(), String> {
    let instance = wgpu::Instance::default();

    let adapter = instance
        .request_adapter(&wgpu::RequestAdapterOptions {
            power_preference: wgpu::PowerPreference::HighPerformance,
            compatible_surface: None,
            force_fallback_adapter: false,
            apply_limit_buckets: false,
        })
        .await
        .map_err(|e| format!("Failed to request GPU adapter: {e}"))?;

    let (device, queue) = adapter
        .request_device(&wgpu::DeviceDescriptor {
            label: Some("antares_wgpu"),
            required_features: wgpu::Features::empty(),
            required_limits: wgpu::Limits::downlevel_defaults(),
            experimental_features: wgpu::ExperimentalFeatures::disabled(),
            memory_hints: Default::default(),
            trace: wgpu::Trace::Off,
        })
        .await
        .map_err(|e| format!("Failed to create GPU device: {e}"))?;

    let vibrance = VibrancePipeline::new(&device);
    let highlights_shadows = HighlightsShadowsPipeline::new(&device);

    GPU_STATE.with(|state| {
        *state.borrow_mut() = Some(GpuState {
            device,
            queue,
            vibrance,
            highlights_shadows,
        });
    });

    Ok(())
}

/// Run a closure with access to the GPU state.
/// Use this to clone the device, queue, and the specific pipeline needed.
///
/// # Example
/// ```rust
/// let (device, queue, vibrance) = gpu::with_gpu_state(|s| {
///     (s.device.clone(), s.queue.clone(), s.vibrance.clone())
/// })?;
/// ```
pub fn with_gpu_state<F, T>(f: F) -> Result<T, String>
where
    F: FnOnce(&GpuState) -> T,
{
    GPU_STATE.with(|state| {
        let state = state.borrow();
        let gpu = state
            .as_ref()
            .ok_or_else(|| "GPU not initialized. Call initFilterEngine() first.".to_string())?;
        Ok(f(gpu))
    })
}
