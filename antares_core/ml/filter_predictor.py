from __future__ import annotations

import torch
from torch import nn


class FilterPredictor(nn.Module):
    def __init__(self, input_dim: int = 40, hidden_dims: tuple[int, int] = (128, 64), output_dim: int = 12):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dims[0]),
            nn.ReLU(),
            nn.Dropout(0.15),
            nn.Linear(hidden_dims[0], hidden_dims[1]),
            nn.ReLU(),
            nn.Linear(hidden_dims[1], output_dim),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)

