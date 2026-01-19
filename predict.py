import cv2
import numpy as np
from tensorflow.keras.models import load_model
from utils import preprocess_image

model = load_model("model/digit_cnn.h5")

img_path = "samples/test1.png"
digit = preprocess_image(img_path)

prediction = model.predict(digit)
predicted_label = np.argmax(prediction)

print("Predicted Digit:", predicted_label)

# show image
img = cv2.imread(img_path)
cv2.imshow("Input Digit", img)
cv2.waitKey(0)
