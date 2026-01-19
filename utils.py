import cv2
import numpy as np

def preprocess_image(path):
    img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)

    # threshold
    _, th = cv2.threshold(img, 120, 255, cv2.THRESH_BINARY_INV)

    # find contours
    contours, _ = cv2.findContours(th, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # pick largest contour = digit
    cnt = max(contours, key=cv2.contourArea)

    x, y, w, h = cv2.boundingRect(cnt)
    digit = th[y:y+h, x:x+w]

    # resize to MNIST shape
    digit = cv2.resize(digit, (28, 28))
    digit = digit.reshape(1, 28, 28, 1) / 255.0

    return digit
