import numpy as np
import cv2

img = np.ones((200,200), dtype=np.uint8) * 255
cv2.putText(img, "5", (60,150), cv2.FONT_HERSHEY_SIMPLEX, 4, (0), 12)
cv2.imwrite("samples/test1.png", img)
