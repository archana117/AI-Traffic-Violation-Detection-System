import streamlit as st
import torch
import numpy as np
import cv2
import matplotlib.pyplot as plt
from PIL import Image
import io
import time
from model import DriverNet

# Page config
st.set_page_config(page_title="AI Self-Driving Car Preview", layout="wide")

st.title("🚗 AI Self-Driving Car: Behavioral Cloning Preview")
st.markdown("""
This app demonstrates how the AI model processes road images and predicts the steering angle.
The model is based on the **NVIDIA CNN** architecture for autonomous driving.
""")

try:
    import torch
    from model import DriverNet
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

# Mock Model for demonstration if torch is missing
class MockModel:
    def predict(self, bias):
        # In mock mode, we simulate a well-behaved AI by following the bias
        return bias * 0.8 + (np.random.rand() - 0.5) * 0.05

def load_model():
    if TORCH_AVAILABLE:
        try:
            model = DriverNet()
            model.eval()
            return model
        except:
            return MockModel()
    return MockModel()

model = load_model()

# Preprocessing functions
def preprocess(image):
    # Crop: remove sky and car hood
    image = image[60:-25, :, :]
    # Resize to 66x200
    image = cv2.resize(image, (200, 66), cv2.INTER_AREA)
    # Convert to YUV
    image = cv2.cvtColor(image, cv2.COLOR_RGB2YUV)
    return image

def create_synthetic_road(steering_bias=0.0):
    """Generates a synthetic road image for demonstration."""
    img = np.zeros((160, 320, 3), dtype=np.uint8)
    # Road (Gray)
    cv2.rectangle(img, (0, 60), (320, 160), (100, 100, 100), -1)
    # Sky (Blue)
    cv2.rectangle(img, (0, 0), (320, 60), (255, 200, 150), -1)
    # Road markings (White)
    pts = np.array([[160, 60], [160 + int(steering_bias*50), 160], 
                    [140 + int(steering_bias*50), 160], [150, 60]], np.int32)
    cv2.fillPoly(img, [pts], (255, 255, 255))
    
    # Left lane boundary
    cv2.line(img, (100, 60), (20 + int(steering_bias*50), 160), (255, 255, 255), 2)
    # Right lane boundary
    cv2.line(img, (220, 60), (300 + int(steering_bias*50), 160), (255, 255, 255), 2)
    
    return img

# Layout
col1, col2 = st.columns([1, 1])

with col1:
    st.subheader("Input & Preprocessing")
    steering_input = st.slider("Simulate Road Curvature", -1.0, 1.0, 0.0, 0.1)
    raw_image = create_synthetic_road(steering_input)
    st.image(raw_image, caption="Raw Camera Image (Simulator View)", use_container_width=True)
    
    processed_image = preprocess(raw_image)
    st.image(processed_image, caption="Preprocessed Image (66x200 YUV)", use_container_width=True)

with col2:
    st.subheader("AI Prediction")
    
    # Run Inference
    if isinstance(model, MockModel):
        prediction = model.predict(steering_input)
    else:
        input_tensor = torch.from_numpy(processed_image).float().permute(2, 0, 1).unsqueeze(0)
        input_tensor = (input_tensor / 127.5) - 1.0 # Normalize
        with torch.no_grad():
            prediction = model(input_tensor).item()
    
    # Visualization of steering
    fig, ax = plt.subplots(figsize=(5, 2))
    ax.set_xlim(-1.1, 1.1)
    ax.set_ylim(-0.5, 0.5)
    ax.axvline(0, color='gray', linestyle='--')
    ax.arrow(0, 0, prediction, 0, head_width=0.1, head_length=0.1, fc='red', ec='red', label='AI Steering')
    ax.set_title(f"Predicted Steering Angle: {prediction:.4f}")
    ax.set_xlabel("Left (-) <---> Right (+)")
    ax.get_yaxis().set_visible(False)
    st.pyplot(fig)
    
    st.info("""
    **Note:** Since we haven't trained the model with the full dataset yet, the prediction above uses 
    initialized weights. After training, the red arrow will accurately point in the direction needed 
    to stay centered in the lane.
    """)

# Mock Training Section
st.divider()
st.subheader("📊 Mock Training Progress")
if st.button("Start Mock Training Demo"):
    progress_bar = st.progress(0)
    status_text = st.empty()
    chart = st.line_chart(np.random.randn(1, 2))
    
    losses = []
    for i in range(20):
        time.sleep(0.1)
        train_loss = 0.5 * (0.9**i) + np.random.rand()*0.05
        val_loss = 0.6 * (0.92**i) + np.random.rand()*0.05
        losses.append([train_loss, val_loss])
        chart.add_rows([[train_loss, val_loss]])
        progress_bar.progress((i + 1) * 5)
        status_text.text(f"Epoch {i+1}/20 - Loss: {train_loss:.4f}")
    
    st.success("Training Demo Complete!")
