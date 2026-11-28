"""MNIST 知识蒸馏最小可运行实现。对应 Hinton et al. §2/§3。"""
import argparse
from pathlib import Path
import torch
from torch import nn
from torch.nn import functional as F
from torch.utils.data import DataLoader
from torchvision import datasets, transforms


class TeacherCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(nn.Conv2d(1, 32, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2), nn.Conv2d(32, 64, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2), nn.Flatten(), nn.Linear(64 * 7 * 7, 128), nn.ReLU(), nn.Dropout(.2), nn.Linear(128, 10))

    def forward(self, x): return self.net(x)


class StudentMLP(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(nn.Flatten(), nn.Linear(28 * 28, 128), nn.ReLU(), nn.Linear(128, 10))

    def forward(self, x): return self.net(x)


def distillation_loss(student_logits, teacher_logits, labels, temperature=4.0, alpha=.7):
    """soft KL 在高温下乘 T²，hard CE 保持真实标签校准。"""
    with torch.no_grad():
        teacher_prob = F.softmax(teacher_logits / temperature, dim=1)
    student_log_prob = F.log_softmax(student_logits / temperature, dim=1)
    loss_soft = F.kl_div(student_log_prob, teacher_prob, reduction="batchmean") * temperature ** 2
    loss_hard = F.cross_entropy(student_logits, labels)
    return alpha * loss_soft + (1 - alpha) * loss_hard


@torch.no_grad()
def accuracy(model, loader, device):
    model.eval(); correct = 0
    for x, y in loader: correct += (model(x.to(device)).argmax(1).cpu() == y).sum().item()
    return correct / len(loader.dataset)


def train_epoch(model, loader, optimizer, device, teacher=None, temperature=4.0, alpha=.7, mode="mix"):
    model.train(); total = 0.0
    for x, y in loader:
        x, y = x.to(device), y.to(device); optimizer.zero_grad(set_to_none=True)
        student_logits = model(x)
        if teacher is None or mode == "hard":
            loss = F.cross_entropy(student_logits, y)
        else:
            with torch.no_grad(): teacher_logits = teacher(x)
            loss = distillation_loss(student_logits, teacher_logits, y, temperature, 1.0 if mode == "soft" else alpha)
        loss.backward(); optimizer.step(); total += loss.item() * y.size(0)
    return total / len(loader.dataset)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=3); parser.add_argument("--batch-size", type=int, default=128)
    parser.add_argument("--temperature", type=float, default=4.0); parser.add_argument("--alpha", type=float, default=.7)
    parser.add_argument("--mode", choices=["hard", "soft", "mix"], default="mix")
    parser.add_argument("--teacher-checkpoint", type=Path, default=None)
    args = parser.parse_args(); device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    tfm = transforms.ToTensor(); train = datasets.MNIST("./data", True, download=True, transform=tfm); test = datasets.MNIST("./data", False, download=True, transform=tfm)
    train_loader = DataLoader(train, batch_size=args.batch_size, shuffle=True); test_loader = DataLoader(test, batch_size=512)
    teacher = TeacherCNN().to(device)
    if args.teacher_checkpoint and args.teacher_checkpoint.exists(): teacher.load_state_dict(torch.load(args.teacher_checkpoint, map_location=device))
    else:
        opt = torch.optim.Adam(teacher.parameters(), lr=1e-3)
        for _ in range(args.epochs): train_epoch(teacher, train_loader, opt, device)
    teacher.eval()
    for p in teacher.parameters(): p.requires_grad_(False)
    print(f"Teacher accuracy: {accuracy(teacher, test_loader, device):.4f}")
    student = StudentMLP().to(device); opt = torch.optim.Adam(student.parameters(), lr=1e-3)
    for epoch in range(args.epochs): print(f"epoch={epoch + 1} loss={train_epoch(student, train_loader, opt, device, teacher, args.temperature, args.alpha, args.mode):.4f}")
    print(f"Student accuracy: {accuracy(student, test_loader, device):.4f}")


if __name__ == "__main__": main()
