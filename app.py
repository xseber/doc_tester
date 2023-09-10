from quart import Quart, render_template, request, jsonify, send_from_directory
from pdf2image import convert_from_bytes
from PIL import Image

import os
import easyocr
import base64
import io
import json 
import numpy as np

app = Quart(__name__)

reader = easyocr.Reader(['en','th'])

# Define the upload directory (make sure it exists)
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Create the upload directory if it doesn't exist
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/')
async def index():
    return await render_template('main.html')

@app.route('/upload', methods=['POST'])
async def upload_file():
    if 'file' not in await request.files:
        return jsonify({'message': 'No file part'})

    file = await request.files['file']

    if file.filename == '':
        return jsonify({'message': 'No selected file'})

    if file:
        filename = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        await file.save(filename)
        return await send_from_directory(app.config['UPLOAD_FOLDER'], file.filename)
    # if file:
    #     # Read the file content and encode it as base64
    #     file_content = file.read()
    #     encoded_image = base64.b64encode(file_content).decode('utf-8')

    #     return jsonify({'success': 'Image uploaded successfully', 'image_data': encoded_image})


@app.route('/convert', methods=['POST'])
async def convert_pdf_to_png():
    files = await request.files
    file = files['file']

    if '.pdf' in file.filename:
        pdf_data = file.read()

            # Convert the PDF to PNG
        images = convert_from_bytes(pdf_data)

            # Save the first page as PNG
        png_data = io.BytesIO()
        images[0].save(png_data, format='PNG')
        png_data.seek(0)
        filename = file.filename.replace('.pdf', '.png')
        filename2 = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        with open(filename2, 'wb') as png_file:
            png_file.write(png_data.read())
            # Encode the PNG data as base64
        # png_base64 = base64.b64encode(png_data.read()).decode('utf-8-sig')
        return await  send_from_directory(app.config['UPLOAD_FOLDER'], filename)
        # return jsonify({'success': 'Image uploaded successfully','image_data':'data:image/png;base64,'+png_base64})
    else :
        filename = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        await file.save(filename)
        return await send_from_directory(app.config['UPLOAD_FOLDER'], file.filename)
    return jsonify({'message': 'Invalid PDF file'})

@app.route('/validate', methods =['POST'])
async def validate():
    global reader
    ress = await request.json
    ress = json.loads(ress)
    result_lists = {}
    for res in ress:
        if len(res['validate_area']) != 0:
            validate_area = res['validate_area']
            image = os.path.join(app.config['UPLOAD_FOLDER'], res['image']).replace('pdf','png')
            ids, x, y, width, height, expected_result = validate_area.values()
            im = Image.open(image)
            val_img = np.array(im.crop((x, y, x+width, y+height)))
            result = reader.readtext(val_img, detail = 0)
            result = ''.join(result)
            if result != expected_result:
                result_lists[ids] = {'result':result, 'expected': expected_result, 'status' : 'N'}
            if result == expected_result:
                result_lists[ids] = {'result':result, 'expected': expected_result, 'status' : 'Y'}

    print(result_lists)
    return jsonify(result_lists)

if __name__ == '__main__':
    app.run(debug=True)
