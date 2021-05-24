cd {path}
python -c "from PIL import Image
import glob
import os
image_list = []

print('training started')

for filename in glob.glob('*.png'):
    im=Image.open(filename).resize((32, 32))
    image_list.append(im)

width=image_list[0].size[0]
height=image_list[0].size[1]
result=Image.new('RGB',(width, len(image_list)*height), (250,250,250))

for i, image in enumerate(image_list):
    result.paste(image, (0, i*height))

try:
    os.mkdir('../../models/merged/')
except:
    pass
result.save('../../models/merged/merged.jpeg','JPEG')
print('training finished')"