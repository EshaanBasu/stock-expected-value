from typing import Callable, Optional

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset


class StockLSTM(nn.Module):
    def __init__(self, input_size: int, hidden_size: int = 64, num_layers: int = 2, dropout: float = 0.2):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size,
            hidden_size,
            num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,
        )
        self.head = nn.Sequential(
            nn.Linear(hidden_size, 32),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(32, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out, _ = self.lstm(x)
        return self.head(out[:, -1, :]).squeeze(-1)


def train_model(
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_val: np.ndarray,
    y_val: np.ndarray,
    epochs: int = 80,
    batch_size: int = 32,
    lr: float = 1e-3,
    progress_callback: Optional[Callable[[int, int, float, float], None]] = None,
) -> StockLSTM:
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    X_tr = torch.tensor(X_train)
    y_tr = torch.tensor(y_train)
    X_v = torch.tensor(X_val).to(device)
    y_v = torch.tensor(y_val).to(device)

    loader = DataLoader(TensorDataset(X_tr, y_tr), batch_size=batch_size, shuffle=True)

    model = StockLSTM(input_size=X_train.shape[2]).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=8, factor=0.5)
    criterion = nn.MSELoss()

    best_val_loss = float("inf")
    best_state: Optional[dict] = None
    patience_counter = 0
    early_stop_patience = 20

    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        for xb, yb in loader:
            xb, yb = xb.to(device), yb.to(device)
            pred = model(xb)
            loss = criterion(pred, yb)
            optimizer.zero_grad()
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            train_loss += loss.item() * len(xb)
        train_loss /= len(X_train)

        model.eval()
        with torch.no_grad():
            val_loss = criterion(model(X_v), y_v).item()

        scheduler.step(val_loss)

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}
            patience_counter = 0
        else:
            patience_counter += 1

        if progress_callback:
            progress_callback(epoch, epochs, train_loss, val_loss)

        if patience_counter >= early_stop_patience:
            break

    if best_state:
        model.load_state_dict(best_state)

    return model.cpu()


def predict(model: StockLSTM, X: np.ndarray) -> float:
    model.eval()
    with torch.no_grad():
        x = torch.tensor(X[None], dtype=torch.float32)
        return model(x).item()
