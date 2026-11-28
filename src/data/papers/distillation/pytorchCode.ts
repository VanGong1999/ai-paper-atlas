export const pytorchCode = String.raw`"""
Knowledge Distillation on MNIST
对应论文：Distilling the Knowledge in a Neural Network, Hinton et al.
运行：python scripts/distillation_mnist_kd.py --epochs 3 --mode mix
依赖：torch torchvision
"""
import argparse
from pathlib import Path
import torch
from torch import nn
from torch.nn import functional as F
from torch.utils.data import DataLoader
from torchvision import datasets, transforms


class TeacherCNN(nn.Module):
    """容量更大的 Teacher：论文里它可以代表 dropout/ensemble 的高质量函数。"""
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Flatten(), nn.Linear(64 * 7 * 7, 128), nn.ReLU(),
            nn.Dropout(0.2), nn.Linear(128, 10),
        )

    def forward(self, x):
        return self.net(x)


class StudentMLP(nn.Module):
    """更小的 Student：部署时只保留它，不再支付 Teacher 的推理成本。"""
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Flatten(), nn.Linear(28 * 28, 128), nn.ReLU(),
            nn.Linear(128, 10),
        )

    def forward(self, x):
        return self.net(x)


def distillation_loss(student_logits, teacher_logits, labels, temperature=4.0, alpha=0.7):
    """论文 §2 的 soft + hard 目标；T² 不是装饰，而是梯度尺度补偿。"""
    # 高温 soft target：把 Teacher 的类间相似性从尖锐分布中释放出来。
    with torch.no_grad():
        teacher_prob = F.softmax(teacher_logits / temperature, dim=1)
    student_log_prob = F.log_softmax(student_logits / temperature, dim=1)
    # KL 的梯度因两个 /T 约缩小到 1/T²，所以显式乘回 T²。
    loss_soft = F.kl_div(student_log_prob, teacher_prob, reduction="batchmean")
    loss_soft = loss_soft * (temperature ** 2)
    # hard target 保留真实标签的校准，避免无条件复制 Teacher 的错误。
    loss_hard = F.cross_entropy(student_logits, labels)
    return alpha * loss_soft + (1.0 - alpha) * loss_hard, loss_soft.detach(), loss_hard.detach()


def train_epoch(model, loader, optimizer, device, teacher=None, temperature=4.0, alpha=0.7, mode="mix"):
    model.train()
    total = 0.0
    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad(set_to_none=True)
        student_logits = model(images)
        if teacher is None or mode == "hard":
            loss = F.cross_entropy(student_logits, labels)
        else:
            with torch.no_grad():
                teacher_logits = teacher(images)
            if mode == "soft":
                # 纯 soft 对照：alpha=1，只看 Teacher 的行为。
                loss = distillation_loss(student_logits, teacher_logits, labels, temperature, 1.0)[0]
            else:
                loss = distillation_loss(student_logits, teacher_logits, labels, temperature, alpha)[0]
        loss.backward()
        optimizer.step()
        total += loss.item() * labels.size(0)
    return total / len(loader.dataset)


@torch.no_grad()
def accuracy(model, loader, device):
    model.eval()
    correct = 0
    for images, labels in loader:
        logits = model(images.to(device))
        correct += (logits.argmax(1).cpu() == labels).sum().item()
    return correct / len(loader.dataset)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--batch-size", type=int, default=128)
    parser.add_argument("--temperature", type=float, default=4.0)
    parser.add_argument("--alpha", type=float, default=0.7)
    parser.add_argument("--mode", choices=["hard", "soft", "mix"], default="mix")
    parser.add_argument("--teacher-checkpoint", type=Path, default=None)
    args = parser.parse_args()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    transform = transforms.ToTensor()
    train = datasets.MNIST("./data", train=True, download=True, transform=transform)
    test = datasets.MNIST("./data", train=False, download=True, transform=transform)
    train_loader = DataLoader(train, batch_size=args.batch_size, shuffle=True)
    test_loader = DataLoader(test, batch_size=512)

    teacher = TeacherCNN().to(device)
    if args.teacher_checkpoint and args.teacher_checkpoint.exists():
        teacher.load_state_dict(torch.load(args.teacher_checkpoint, map_location=device))
    else:
        # 最小可复现实验：先用 hard labels 预训练 Teacher。
        optimizer_t = torch.optim.Adam(teacher.parameters(), lr=1e-3)
        for _ in range(args.epochs):
            train_epoch(teacher, train_loader, optimizer_t, device)
    teacher.eval()
    for parameter in teacher.parameters():
        parameter.requires_grad_(False)
    print(f"Teacher accuracy: {accuracy(teacher, test_loader, device):.4f}")

    student = StudentMLP().to(device)
    optimizer_s = torch.optim.Adam(student.parameters(), lr=1e-3)
    for epoch in range(args.epochs):
        loss = train_epoch(student, train_loader, optimizer_s, device, teacher, args.temperature, args.alpha, args.mode)
        print(f"epoch={epoch + 1} mode={args.mode} loss={loss:.4f}")
    print(f"Student accuracy: {accuracy(student, test_loader, device):.4f}")


if __name__ == "__main__":
    main()
`
