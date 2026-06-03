import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, SubsetRandomSampler
import torchvision.transforms as transforms
import torch_optimizer as optim_ext # Replacement for RAdam
import cv2
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from model import DriverNet
from PIL import Image

# Configuration
DATA_CSV_FILE_PATH = './input/driving_log.csv'
DATA_IMAGES_DIR = './input/IMG'
MODEL_SAVE_PATH = './output/ai_driver_cnn.pth'
IMAGE_HEIGHT, IMAGE_WIDTH, IMAGE_CHANNELS = 66, 200, 3
BATCH_SIZE = 64
NUM_EPOCHS = 10
VALIDATION_SPLIT = 0.2

# Preprocessing Functions
def preprocess(image):
    image = image[60:-25, :, :] # Crop
    image = cv2.resize(image, (IMAGE_WIDTH, IMAGE_HEIGHT), cv2.INTER_AREA)
    image = cv2.cvtColor(image, cv2.COLOR_RGB2YUV)
    return image

def augment(data_dir, center, left, right, steering_angle):
    # Simplified augmentation for reliability
    choice = np.random.choice(3)
    if choice == 0:
        image = plt.imread(os.path.join(data_dir, left.strip().split('/')[-1]))
        steering_angle += 0.2
    elif choice == 1:
        image = plt.imread(os.path.join(data_dir, right.strip().split('/')[-1]))
        steering_angle -= 0.2
    else:
        image = plt.imread(os.path.join(data_dir, center.strip().split('/')[-1]))
    
    # Random Flip
    if np.random.rand() < 0.5:
        image = cv2.flip(image, 1)
        steering_angle = -steering_angle
        
    return image, steering_angle

class CarDataset(torch.utils.data.Dataset):
    def __init__(self, csv_file, image_dir, transform=None):
        self.data = pd.read_csv(csv_file, names=['center', 'left', 'right', 'steering', 'throttle', 'brake', 'speed'])
        self.image_dir = image_dir
        self.transform = transform

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        row = self.data.iloc[idx]
        image, steering = augment(self.image_dir, row['center'], row['left'], row['right'], row['steering'])
        image = preprocess(image)
        
        if self.transform:
            image = self.transform(image)
            
        return image, torch.tensor(steering, dtype=torch.float32)

def train():
    if not os.path.exists('./output'):
        os.makedirs('./output')

    # Check for data
    if not os.path.exists(DATA_CSV_FILE_PATH):
        print(f"Error: {DATA_CSV_FILE_PATH} not found. Please run download_data.py or provide the dataset.")
        return

    transformations = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
    ])

    dataset = CarDataset(DATA_CSV_FILE_PATH, DATA_IMAGES_DIR, transformations)
    dataset_size = len(dataset)
    indices = list(range(dataset_size))
    split = int(np.floor(VALIDATION_SPLIT * dataset_size))
    
    np.random.shuffle(indices)
    train_indices, val_indices = indices[split:], indices[:split]

    train_sampler = SubsetRandomSampler(train_indices)
    val_sampler = SubsetRandomSampler(val_indices)

    train_loader = DataLoader(dataset, batch_size=BATCH_SIZE, sampler=train_sampler)
    val_loader = DataLoader(dataset, batch_size=BATCH_SIZE, sampler=val_sampler)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = DriverNet().to(device)
    criterion = nn.MSELoss()
    optimizer = optim_ext.RAdam(model.parameters(), lr=0.0001)

    print(f"Starting training on {device}...")
    
    history = {'train_loss': [], 'val_loss': []}
    best_val_loss = float('inf')

    for epoch in range(NUM_EPOCHS):
        model.train()
        train_loss = 0
        for images, steerings in train_loader:
            images, steerings = images.to(device), steerings.to(device)
            
            optimizer.zero_grad()
            outputs = model(images).squeeze()
            loss = criterion(outputs, steerings)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
        
        model.eval()
        val_loss = 0
        with torch.no_grad():
            for images, steerings in val_loader:
                images, steerings = images.to(device), steerings.to(device)
                outputs = model(images).squeeze()
                loss = criterion(outputs, steerings)
                val_loss += loss.item()
        
        avg_train_loss = train_loss / len(train_loader)
        avg_val_loss = val_loss / len(val_loader)
        
        history['train_loss'].append(avg_train_loss)
        history['val_loss'].append(avg_val_loss)
        
        print(f"Epoch [{epoch+1}/{NUM_EPOCHS}], Train Loss: {avg_train_loss:.4f}, Val Loss: {avg_val_loss:.4f}")
        
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            torch.save(model.state_dict(), MODEL_SAVE_PATH)
            print("Model saved!")

    # Plot results
    plt.figure()
    plt.plot(history['train_loss'], label='Train Loss')
    plt.plot(history['val_loss'], label='Val Loss')
    plt.title('Training and Validation Loss')
    plt.xlabel('Epochs')
    plt.ylabel('MSE')
    plt.legend()
    plt.savefig('./output/loss_plot.png')
    print("Loss plot saved to ./output/loss_plot.png")

if __name__ == "__main__":
    train()
