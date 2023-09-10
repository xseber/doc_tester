
        var canvas = document.getElementById('imageCanvas');
        var ctx = canvas.getContext('2d');
        var update_button = document.getElementById('update_rect');
        var image = new Image();
        let isDrawing = false;
        let startX, startY, endX, endY;
        let labels = [];
        let offsetX = 0;
        let offsetY = 0;
        let filename = '';
        let selectedLabel = null;
        const imageInput = document.getElementById('imageInput');


        


            // Function to clear the canvas and redraw labels

            imageInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                
                if (file) {

                    filename = file.name;
                    const formData = new FormData();
                    formData.append('file', file);
    
                    await fetch('/convert', {
                        method: 'POST',
                        body: formData,
                    })
                    .then(response => response.blob())
                    .then(blob => {
                        const urlCreator = window.URL || window.webkitURL;
                        if (blob) {
                            image.src = urlCreator.createObjectURL(blob);;
                        }
                    });
    
                }
            });
    
            image.onload = () => {
                canvas.width = image.width;
                canvas.height = image.height;
                ctx.drawImage(image, 0, 0);
    
                // Function to draw a rectangle on the canvas
                function drawRect(x, y, width, height) {
                    ctx.beginPath();
                    ctx.rect(x, y, width, height);
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = 'red';
                    ctx.setLineDash([10, 5]);
                    ctx.stroke();
                }
                function clearCanvas() {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(image, 0, 0);
    
                    // Draw labels
                    labels.forEach(label => {
                        drawRect(label.x, label.y, label.width, label.height);
                    });
                }
                
                function update_rect(){
                    if (selectedLabel){
                        selectedLabel.name = document.getElementById('rect_name').value;
                        selectedLabel.x = parseFloat(document.getElementById('xInput').value);
                        selectedLabel.y = parseFloat(document.getElementById('yInput').value);
                        selectedLabel.width = parseFloat(document.getElementById('widthInput').value);
                        selectedLabel.height = parseFloat(document.getElementById('heightInput').value);
                        selectedLabel.expected_result = document.getElementById('expected_resultInput').value;
                        clearCanvas();
                    }
                }

            // Event listener for "Draw Rectangle" button
            document.getElementById('drawRectButton').addEventListener('click', () => {
                isDrawing = true;
                startX = null;
                startY = null;
            });

            // Event listener for "Delete Selected" button
            document.getElementById('deleteRectButton').addEventListener('click', () => {
                labels = labels.filter(label => !label.selected);
                clearCanvas();
            });

            // Event listener for "Clear Canvas" button
            document.getElementById('clearCanvasButton').addEventListener('click', () => {
                labels.length = 0;
                clearCanvas();
            });

            // Event listener for "Export Labels" button
            document.getElementById('validateButton').addEventListener('click', () => {
                // Convert screen coordinates to image coordinates
                const scaleFactorX = image.width / canvas.width;
                const scaleFactorY = image.height / canvas.height;

                const labelsInImageCoordinates = labels.map(function(label) {

                    var info =    { 'image': filename,
                        'validate_area' : {'id' : label.name,
                        'x': label.x * scaleFactorX,
                        'y': label.y * scaleFactorY,
                        'width': label.width * scaleFactorX,
                        'height': label.height * scaleFactorY,
                        'expected_result': label.expected_result,
                        }
                    };
                    return info;
                });

                // Now, labelsInImageCoordinates contains the label coordinates in the context of the image
                const jsonLabels = JSON.stringify(labelsInImageCoordinates);

                fetch('/validate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(jsonLabels)
                });

                //const blob = new Blob([jsonLabels], { type: 'application/json' });
                //const url = URL.createObjectURL(blob);
                //const a = document.createElement('a');
                //a.style.display = 'none';
                //a.href = url;
                //a.download = 'labels.json';
                //document.body.appendChild(a);
                //a.click();
                //window.URL.revokeObjectURL(url);

                
            });

            document.getElementById('exportLabelsButton').addEventListener('click', () => {
                // Convert screen coordinates to image coordinates
                const scaleFactorX = image.width / canvas.width;
                const scaleFactorY = image.height / canvas.height;

                const labelsInImageCoordinates = labels.map(function(label) {

                    var info =    { 'image': filename,
                        'validate_area' : {'id' : label.name,
                        'x': label.x * scaleFactorX,
                        'y': label.y * scaleFactorY,
                        'width': label.width * scaleFactorX,
                        'height': label.height * scaleFactorY,
                        'expected_result': label.expected_result,
                        }
                    };
                    return info;
                });

                // Now, labelsInImageCoordinates contains the label coordinates in the context of the image
                const jsonLabels = JSON.stringify(labelsInImageCoordinates);


                const blob = new Blob([jsonLabels], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                // Open the Blob's URL in a new tab or window
                window.open(url, '_blank');

                // Revoke the URL to free up resources (optional)
                window.URL.revokeObjectURL(url);

                // const a = document.createElement('a');
                // a.style.display = 'none';
                // a.href = url;
                // a.download = 'labels.json';
                // document.body.appendChild(a);
                // a.click();
                // window.URL.revokeObjectURL(url);

            });

            // Event listener for the canvas to draw rectangles
            canvas.addEventListener('mousedown', (e) => {
                if (isDrawing) {
                   
                    startX = e.clientX - canvas.getBoundingClientRect().left;
                    startY = e.clientY - canvas.getBoundingClientRect().top;
                }
                const x = e.clientX - canvas.getBoundingClientRect().left;
                const y = e.clientY - canvas.getBoundingClientRect().top;

                selectedLabel = labels.find(label =>
                    x >= label.x && x <= label.x + label.width &&
                    y >= label.y && y <= label.y + label.height
                );

                if (selectedLabel) {
                    selectedLabel.selected = true;
                    clearCanvas();
                    document.getElementById('rect_name').value = selectedLabel.name;
                    document.getElementById('xInput').value = selectedLabel.x;
                    document.getElementById('yInput').value = selectedLabel.y;
                    document.getElementById('widthInput').value = selectedLabel.width;
                    document.getElementById('heightInput').value = selectedLabel.height;
                    document.getElementById('expected_resultInput').value = selectedLabel.expected_result;
                    
                }
                else {
                    labels.forEach(element => {
                        element.selected = false;
                    });
                    selectedLabel = null;
                    document.getElementById('rect_name').value = '';
                    document.getElementById('xInput').value = '';
                    document.getElementById('yInput').value = '';
                    document.getElementById('widthInput').value = '';
                    document.getElementById('heightInput').value = '';
                    document.getElementById('expected_resultInput').value = '';
                }
            });

            canvas.addEventListener('mousemove', (e) => {

                if (!isDrawing) return;
                endX = e.clientX - canvas.getBoundingClientRect().left;
                endY = e.clientY - canvas.getBoundingClientRect().top;
                clearCanvas();
                if (startX && startY && isDrawing) {
                    drawRect(startX, startY, endX - startX, endY - startY);
                    
                }
            });

            canvas.addEventListener('mouseup', () => {
                if (!isDrawing) return;
                isDrawing = false;
                endX = endX || startX;
                endY = endY || startY;

                labels.push({
                    name: 'Label' + ((labels.length|| 0) +1).toString(),
                    x: Math.min(startX, endX),
                    y: Math.min(startY, endY),
                    width: Math.abs(endX - startX),
                    height: Math.abs(endY - startY),
                    selected: false,
                    expected_result: '',
                });
                clearCanvas();
            });

            update_button.addEventListener('mousedown', () => {
                update_rect();
            });
            
            //clearCanvas();
        };
