DriverNet AI– Autonomous Driving System

DriverNet AI is a deep learning-based autonomous driving system that predicts vehicle steering angles from road images using a Convolutional Neural Network (CNN). Inspired by NVIDIA's end-to-end behavioral cloning architecture, the model learns driving behavior directly from human driving data and enables real-time self-driving car simulation

Features
End-to-end autonomous driving using CNN.
Real-time steering angle prediction.
Interactive driving simulator.
Behavioral cloning approach for imitation learning.
Image preprocessing and augmentation pipeline.
Training dashboard with loss visualization.
Responsive and modern web interface.
PyTorch-based deep learning implementation.
Technologies Used
Python
PyTorch
OpenCV
NumPy
Pandas
Matplotlib
HTML
CSS
JavaScript
Streamlit
Deep Learning Architecture

The model is based on NVIDIA's self-driving car architecture and consists of:

5 Convolutional Layers with ELU activation
Dropout for regularization
4 Fully Connected Layers
Continuous steering angle prediction output
Data Preprocessing

The input images undergo:

Cropping
Resizing to 66×200 pixels
RGB to YUV conversion
Random flipping
Data augmentation for better generalization
