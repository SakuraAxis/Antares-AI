# Antares-AI

[![GitHub last commit](https://img.shields.io/github/last-commit/SakuraAxis/Antares-AI.svg)](https://github.com/zzztzzzt/Fomalhaut.jl)
[![GitHub repo size](https://img.shields.io/github/repo-size/SakuraAxis/Antares-AI.svg)](https://github.com/zzztzzzt/Fomalhaut.jl)

<br>

<img src="https://github.com/SakuraAxis/Antares-AI/blob/main/logo/logo.png" alt="antares-logo" style="height: 280px; width: auto;" />

### Antares - One-Step photo enhancing. - AI Photo Enhancer / Editor.

IMPORTANT : This project is still in the development and testing stages, licensing terms may be updated in the future. Please don't do any commercial usage currently.

## Project Dependencies Guide

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://github.com/fastapi/fastapi)
[![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://github.com/pytorch/pytorch)
[![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)](https://github.com/opencv/opencv)
[![Pillow](https://img.shields.io/badge/Pillow-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://github.com/python-pillow/Pillow)
[![SciPy](https://img.shields.io/badge/SciPy-8CAAE6?style=for-the-badge&logo=scipy&logoColor=white)](https://github.com/scipy/scipy)

**( GUI )**

[![WGPU](https://img.shields.io/badge/WGPU-40E0D0?style=for-the-badge&logo=wgpu&logoColor=white)](https://github.com/gfx-rs/wgpu)
[![Vue3](https://img.shields.io/badge/vue3-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)](https://github.com/vuejs/core)
[![Tailwind CSS](https://img.shields.io/badge/tailwind_css-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://github.com/tailwindlabs/tailwindcss)
[![vite](https://img.shields.io/badge/vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://github.com/vitejs/vite)

**[ for Dependencies Details please see the end of this README ]**

Iris uses PyTorch, OpenCV, Pillow & SciPy for AI Model Building. PyTorch & SciPy licensed under BSD 3-Clause License. OpenCV is licensed under the Apache-2.0 License. Pillow licensed under MIT-CMU License.

Iris uses FastAPI for backend APIs and GUI integration. FastAPI is MIT licensed.

Iris uses WGPU, Vue3 & Tailwind CSS for GUI showing. And uses Vite as build tool. Vue3, Vite & Tailwind CSS licensed under the MIT License. WGPU licensed under the MIT License & Apache-2.0 License.

## How To Use

install Rust : [https://rust-lang.org/](https://rust-lang.org/)

install Node.js : [https://nodejs.org/](https://nodejs.org/)

install Python : [https://www.python.org/downloads/](https://www.python.org/downloads/)

Install uv : `python -m pip install --upgrade pip` => `python -m pip install uv`

### step 1. Setup Photo Editor ( Frontend )

go to `/antares_wgpu`, run below

```shell
cargo install wasm-pack
```

( every time you change Rust code, you need to run this )
```shell
wasm-pack build –target web –release
```

go back to `project root`

and then go to `/antares-ai`

```shell
npm install
```

```shell
npm run dev
```

### step 2. Setup Backend AI Training

go to `/antares_core`

```shell
python -m uv sync
```

```shell
python -m uv run uvicorn main:app --reload --port 8000
```

## Project Dependencies Details

FastAPI License : [https://github.com/fastapi/fastapi/blob/master/LICENSE](https://github.com/fastapi/fastapi/blob/master/LICENSE)
<br>

PyTorch License : [https://github.com/pytorch/pytorch/blob/main/LICENSE](https://github.com/pytorch/pytorch/blob/main/LICENSE)
<br>

OpenCV License : [https://github.com/opencv/opencv/blob/4.x/LICENSE](https://github.com/opencv/opencv/blob/4.x/LICENSE)
<br>

Pillow License : [https://github.com/python-pillow/Pillow/blob/main/LICENSE](https://github.com/python-pillow/Pillow/blob/main/LICENSE)
<br>

SciPy License : [https://github.com/scipy/scipy/blob/main/LICENSE.txt](https://github.com/scipy/scipy/blob/main/LICENSE.txt)
<br>

wgpu License : [https://github.com/gfx-rs/wgpu/blob/trunk/LICENSE.MIT](https://github.com/gfx-rs/wgpu/blob/trunk/LICENSE.MIT) and [another Apache-2.0 License](https://github.com/gfx-rs/wgpu/blob/trunk/LICENSE.APACHE)
<br>

Vue3 License : [https://github.com/vuejs/core/blob/main/LICENSE](https://github.com/vuejs/core/blob/main/LICENSE)
<br>

Vite License : [https://github.com/vitejs/vite/blob/main/LICENSE](https://github.com/vitejs/vite/blob/main/LICENSE)
<br>

Tailwind CSS License : [https://github.com/tailwindlabs/tailwindcss/blob/main/LICENSE](https://github.com/tailwindlabs/tailwindcss/blob/main/LICENSE)
