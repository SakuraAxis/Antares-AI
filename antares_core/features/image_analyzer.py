import cv2
import numpy as np
from PIL import Image
import io
from scipy.stats import entropy as scipy_entropy
from typing import Dict, Any


class ImageAnalyzer:
    """Image feature extractor - Precisely extracts 21 features"""
    
    def __init__(self):
        print("ImageAnalyzer initialized")
    
    def analyze(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Analyze image and extract 21 features
        
        Feature categories:
        - Exposure (8 Features): Brightness-related
        - Color (9 Features): Color-related (including unique_colors_ratio)
        - Detail (4 Features): Detail-related
        
        Args:
            image_bytes: Image bytes data
            
        Returns:
            Dictionary containing 21 features
        """
        # Convert to OpenCV format
        nparr = np.frombuffer(image_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img_bgr is None:
            raise ValueError("Unable to decode image")
        
        # Prepare PIL Image for color complexity analysis
        pil_image = Image.open(io.BytesIO(image_bytes))
        
        # Extract three categories of features
        exposure_features = self._extract_exposure_features(img_bgr)
        color_features = self._extract_color_features(img_bgr, pil_image)
        detail_features = self._extract_detail_features(img_bgr)
        
        # Merge all features
        return {
            **exposure_features,
            **color_features,
            **detail_features,
        }
    
    def _extract_exposure_features(self, img_bgr: np.ndarray) -> Dict[str, Any]:
        """
        Extract Exposure features (8)
        
        Features:
        1. brightness_mean - Grayscale mean brightness
        2. brightness_std - Grayscale brightness standard deviation
        3. brightness_p5 - Grayscale 5th percentile
        4. brightness_p50 - Grayscale median
        5. brightness_p95 - Grayscale 95th percentile
        6. dynamic_range - brightness_p95 - brightness_p5
        7. black_clip_ratio - Ratio of pixels with brightness ≤ 5
        8. white_clip_ratio - Ratio of pixels with brightness ≥ 250
        """
        # Convert to grayscale
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        
        # 1. Mean brightness
        brightness_mean = float(np.mean(gray))
        
        # 2. Brightness standard deviation
        brightness_std = float(np.std(gray))
        
        # 3-5. Percentiles
        brightness_p5 = float(np.percentile(gray, 5))
        brightness_p50 = float(np.percentile(gray, 50))
        brightness_p95 = float(np.percentile(gray, 95))
        
        # 6. Dynamic range
        dynamic_range = brightness_p95 - brightness_p5
        
        # 7. Black clipping ratio (brightness ≤ 5)
        black_clip_ratio = float(np.sum(gray <= 5) / gray.size)
        
        # 8. White clipping ratio (brightness ≥ 250)
        white_clip_ratio = float(np.sum(gray >= 250) / gray.size)
        
        return {
            "brightness_mean": brightness_mean,
            "brightness_std": brightness_std,
            "brightness_p5": brightness_p5,
            "brightness_p50": brightness_p50,
            "brightness_p95": brightness_p95,
            "dynamic_range": dynamic_range,
            "black_clip_ratio": black_clip_ratio,
            "white_clip_ratio": white_clip_ratio,
        }
    
    def _extract_color_features(self, img_bgr: np.ndarray, pil_image: Image.Image) -> Dict[str, Any]:
        """
        Extract Color features (9)
        
        Features:
        9. saturation_mean - HSV S channel mean
        10. saturation_std - HSV S channel standard deviation
        11. mean_r - R channel mean
        12. mean_g - G channel mean
        13. mean_b - B channel mean
        14. lab_a_mean - LAB A channel mean (Green ↔ Magenta)
        15. lab_b_mean - LAB B channel mean (Blue ↔ Yellow)
        16. dominant_colors - Top 10 dominant colors via K-Means
        17. unique_colors_ratio - Unique colors / Total pixels (color complexity)
        """
        # 9-10. HSV saturation
        hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
        saturation = hsv[:, :, 1]
        saturation_mean = float(np.mean(saturation))
        saturation_std = float(np.std(saturation))
        
        # 11-13. RGB channel means (BGR -> RGB)
        mean_b = float(np.mean(img_bgr[:, :, 0]))
        mean_g = float(np.mean(img_bgr[:, :, 1]))
        mean_r = float(np.mean(img_bgr[:, :, 2]))
        
        # 14-15. LAB color space
        lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
        lab_a_mean = float(np.mean(lab[:, :, 1]))  # A channel: Green ↔ Magenta
        lab_b_mean = float(np.mean(lab[:, :, 2]))  # B channel: Blue ↔ Yellow
        
        # 16. Dominant colors (K-Means, top 10)
        dominant_colors = self._extract_dominant_colors(img_bgr, k=10)
        
        # 17. Color complexity (using Pillow)
        unique_colors_ratio = self._calculate_unique_colors_ratio(pil_image)
        
        return {
            "saturation_mean": saturation_mean,
            "saturation_std": saturation_std,
            "mean_r": mean_r,
            "mean_g": mean_g,
            "mean_b": mean_b,
            "lab_a_mean": lab_a_mean,
            "lab_b_mean": lab_b_mean,
            "dominant_colors": dominant_colors,
            "unique_colors_ratio": unique_colors_ratio,
        }
    
    def _extract_dominant_colors(self, img_bgr: np.ndarray, k: int = 5) -> list:
        """
        Extract dominant colors using K-Means (top 5)
        
        Returns:
            [{"rgb": [r, g, b], "percentage": 0.xx}, ...]
        """
        # Reshape image to pixel list
        pixels = img_bgr.reshape(-1, 3).astype(np.float32)
        
        # K-means clustering
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 0.2)
        _, labels, centers = cv2.kmeans(pixels, k, None, criteria, 10, cv2.KMEANS_PP_CENTERS)
        
        # Calculate percentage of each color
        unique, counts = np.unique(labels, return_counts=True)
        percentages = counts / counts.sum()
        
        # Format results (BGR -> RGB)
        dominant_colors = []
        for i, center in enumerate(centers):
            dominant_colors.append({
                "rgb": [int(center[2]), int(center[1]), int(center[0])],  # BGR to RGB
                "percentage": float(percentages[i]),
            })
        
        # Sort by percentage
        dominant_colors.sort(key=lambda x: x["percentage"], reverse=True)
        
        return dominant_colors
    
    def _calculate_unique_colors_ratio(self, pil_image: Image.Image) -> float:
        """
        Calculate color complexity (unique colors / total pixels)
        
        Uses Pillow's getcolors() method to count unique colors.
        For high-resolution images, sets a reasonable maxcolors limit to avoid memory issues.
        
        Args:
            pil_image: PIL Image object
            
        Returns:
            unique_colors_ratio: Value between 0.0 and 1.0
            - Close to 0: Monotonous colors (e.g., solid background)
            - Close to 1: Extremely rich colors (e.g., high-frequency details)
        """
        # Convert to RGB mode (unified processing)
        if pil_image.mode != 'RGB':
            pil_image = pil_image.convert('RGB')
        
        # Calculate total pixels
        width, height = pil_image.size
        total_pixels = width * height
        
        # Set maxcolors limit (avoid memory issues)
        # For large images, set a reasonable upper limit
        max_colors_limit = min(total_pixels, 65536)  # Max 65536 colors
        
        # Use Pillow's getcolors() to count unique colors
        colors = pil_image.getcolors(maxcolors=max_colors_limit)
        
        if colors is None:
            # Exceeds maxcolors limit, indicating very many colors
            # Return a ratio close to the limit
            unique_colors_ratio = float(max_colors_limit / total_pixels)
        else:
            # Calculate actual unique color count
            unique_colors_count = len(colors)
            unique_colors_ratio = float(unique_colors_count / total_pixels)
        
        return unique_colors_ratio
    
    def _extract_detail_features(self, img_bgr: np.ndarray) -> Dict[str, float]:
        """
        Extract Detail features (4)
        
        Features:
        18. sharpness - Laplacian Variance
        19. edge_density - Canny edge pixel ratio
        20. entropy - Grayscale information entropy
        21. local_contrast - Local contrast (32×32 blocks average)
        """
        # Convert to grayscale
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        
        # 18. Sharpness (Laplacian Variance)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        sharpness = float(laplacian.var())
        
        # 19. Edge density (Canny)
        edges = cv2.Canny(gray, 100, 200)
        edge_density = float(np.sum(edges > 0) / edges.size)
        
        # 20. Information entropy
        # Calculate grayscale histogram
        hist, _ = np.histogram(gray, bins=256, range=(0, 256))
        hist = hist / hist.sum()  # Normalize to probability distribution
        # Filter out 0 values to avoid log(0)
        hist = hist[hist > 0]
        entropy = float(scipy_entropy(hist, base=2))
        
        # 21. Local contrast (32×32 blocks)
        local_contrast = self._calculate_local_contrast(gray, block_size=32)
        
        return {
            "sharpness": sharpness,
            "edge_density": edge_density,
            "entropy": entropy,
            "local_contrast": local_contrast,
        }
    
    def _calculate_local_contrast(self, gray: np.ndarray, block_size: int = 32) -> float:
        """
        Calculate local contrast
        
        Divides image into block_size × block_size blocks,
        calculates brightness standard deviation for each block,
        then takes the average
        
        Args:
            gray: Grayscale image
            block_size: Block size (default 32×32)
            
        Returns:
            Average local contrast
        """
        h, w = gray.shape
        contrasts = []
        
        # Iterate through all blocks
        for y in range(0, h, block_size):
            for x in range(0, w, block_size):
                # Extract block
                block = gray[y:y+block_size, x:x+block_size]
                
                # Skip blocks that are too small
                if block.size < (block_size * block_size * 0.5):
                    continue
                
                # Calculate standard deviation (contrast) of this block
                block_contrast = float(np.std(block))
                contrasts.append(block_contrast)
        
        # Return average local contrast
        return float(np.mean(contrasts)) if contrasts else 0.0
