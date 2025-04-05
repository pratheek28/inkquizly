import React, { useRef, useState, useEffect } from 'react';
import * as fabric from 'fabric';

const CanvasEditor = () => {
    const [canvases, setCanvases] = useState([]); // Single canvas
    const [brushColor, setBrushColor] = useState('#000000'); // Default to black marker
    const [activeTool, setActiveTool] = useState('point'); // Track the active tool
    const [activeCanvasIndex,setActiveCanvasIndex]=useState(null);
    const canvasRef = useRef([]); // Ref for the canvas element

    const A4_WIDTH = 794;
    const A4_HEIGHT = 1123;

    const numPages=10;

    useEffect(() => {
        // Call this when user opens app
        const newCanvases = [];

        for (let i = 0; i < numPages; i++) {
            const canvas = new fabric.Canvas(canvasRef.current[i], {
              width: A4_WIDTH,
              height: A4_HEIGHT,
              backgroundColor: null, // ensures transparency
            });
            // Start in drawing mode
            canvas.isDrawingMode = true;
            canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
            canvas.freeDrawingBrush.color = brushColor;
            canvas.freeDrawingBrush.width = 5;
      
            // Attach a click handler for selecting the active canvas.
            const handleClick = () => {
              setActiveCanvasIndex(i);
              console.log(`Canvas ${i} clicked`);
            };
      
            canvas.on('mouse:down', () => handleClick(i));
      
            console.log("canvas created");
            newCanvases.push(canvas);
          }
        
  
        setCanvases(newCanvases);
    

      
      
        return () => {
          newCanvases.forEach((canvas) => {
            canvas.dispose();
            canvas.off('mouse:down');
          });
          console.log("canvas deleted");
        };
      }, []);



      const handleBrushColorChange = (color) => {
        let canvas=canvases[activeCanvasIndex];
        setBrushColor(color);
        if (canvas) {
          canvas.freeDrawingBrush.color = color;
        }
      };

    
      const handleCanvasClick=(index)=>{
        setActiveCanvasIndex(index);
        console.log('Canvas',index,'clicked');
      };

      function hexToRgba(hex, alpha) {
        // Remove # if present
        hex = hex.replace('#', '');
      
        // Parse short hex (#fff) to full hex (#ffffff)
        if (hex.length === 3) {
          hex = hex.split('').map(c => c + c).join('');
        }
      
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
      
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }



      useEffect(()=>{
        canvases.forEach((canvas)=>{
            if(canvas){
                if(activeTool==='pen'){
                    canvas.off('mouse:up');
                    canvas.isDrawingMode = true;
                    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
                    canvas.freeDrawingBrush.color = brushColor;
                    canvas.freeDrawingBrush.width = 5;
                }
                else if(activeTool==='marker'){
                    canvas.off('mouse:up');
                    canvas.isDrawingMode = true;
                    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
                    canvas.freeDrawingBrush.color = brushColor;
                    canvas.freeDrawingBrush.width = 10;
                }
                else if(activeTool==='highlighter'){
                    canvas.off('mouse:up');
                    canvas.isDrawingMode = true;
                    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
                    let bColor = hexToRgba(brushColor, 0.5);
                    canvas.freeDrawingBrush.color = bColor;
                    canvas.freeDrawingBrush.width = 15;
                }
                else if(activeTool==='eraser'){
                    canvas.off('mouse:up');
                    canvas.isDrawingMode = true;
                    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
                    canvas.freeDrawingBrush.color = 'rgba(255, 169, 78, 0.5)';
                    canvas.freeDrawingBrush.width = 10;
                    // Attach custom eraser event handlers
                    canvas.on('mouse:down', function (e) {
                        const pointer = canvas.getPointer(e.e);
                        // Start collecting eraser stroke points
                        canvas._currentEraserPoints = [pointer];
                        canvas.isErasing = true;
                    });
                    canvas.on('mouse:move', function (e) {
                        if (canvas.isErasing) {
                        const pointer = canvas.getPointer(e.e);
                        canvas._currentEraserPoints.push(pointer);
                        }
                    });
                    canvas.on('mouse:up', function (e) {
                        if (canvas.isErasing) {
                        canvas.isErasing = false;
                        const eraserPoints = canvas._currentEraserPoints;
                        delete canvas._currentEraserPoints;

                        // Iterate through drawn strokes (fabric.Path objects)
                        // and remove a stroke if any eraser point touches its bounding box.
                        canvas.getObjects().forEach((obj) => {
                            const bbox = obj.getBoundingRect();
                            for (let i = 0; i < eraserPoints.length; i++) {
                            const pt = eraserPoints[i];
                            if (
                                pt.x >= bbox.left &&
                                pt.x <= bbox.left + bbox.width &&
                                pt.y >= bbox.top &&
                                pt.y <= bbox.top + bbox.height
                            ) {
                                canvas.remove(obj);
                                break; // Remove once a hit is found.
                            }
                            }
                        });
                        canvas.renderAll();
                        }
                    });



                }
                else if(activeTool==='text'){
                    canvas.isDrawingMode = false;
        canvas.off('mouse:up'); // Remove previous event listeners
        canvas.on('mouse:up', (e) => {
          if (!e.target) {
            const pointer = canvas.getPointer(e.e);
            const text = new fabric.Textbox('Click to edit text', {
              left: pointer.x,
              top: pointer.y,
              width: 200,
              fontSize: 24,
            });
            canvas.add(text);
            canvas.setActiveObject(text); // Make the new text object editable
            canvas.renderAll();
          }
        });
                }

                else if (activeTool === 'subhl') {
                    
                  }
                  






            }


        })



      },[activeTool])


      const captureHighlightedTextSnippet = (highlightRect) => {
        // Get all objects on the canvas (you might want to filter them based on type if needed)
        const objectsInRegion = canvases[activeCanvasIndex].getObjects().filter((obj) => {
          return obj instanceof fabric.Text || obj instanceof fabric.Textbox;
        });
      
        // Find the objects that fall inside the highlighted region (highlightRect)
        const objectsToCapture = objectsInRegion.filter((obj) => {
          const objBoundingBox = obj.getBoundingRect();
          // Check if the object is inside the highlighted area
          return (
            objBoundingBox.left + objBoundingBox.width > highlightRect.left &&
            objBoundingBox.top + objBoundingBox.height > highlightRect.top &&
            objBoundingBox.left < highlightRect.left + highlightRect.width &&
            objBoundingBox.top < highlightRect.top + highlightRect.height
          );
        });
      
        if (objectsToCapture.length > 0) {
          // Create a temporary Fabric canvas to hold the snippet image
          const snippetCanvas = new fabric.Canvas(null, {
            width: highlightRect.width,
            height: highlightRect.height,
            backgroundColor: null, // Transparent background
          });
      
          // Draw the objects within the highlighted region on the snippet canvas
          objectsToCapture.forEach((obj) => {
            // Position the object relative to the highlight rect's top-left corner
            obj.set({
              left: obj.left - highlightRect.left,
              top: obj.top - highlightRect.top,
            });
            snippetCanvas.add(obj);
          });
      
          // Render all objects on the new canvas
          snippetCanvas.renderAll();
      
          // Now you can export the snippet as an image
          const snippetDataUrl = snippetCanvas.toDataURL({
            format: 'png', // You can choose between 'jpeg', 'png', etc.
          });
      
          // To download or view the snippet image, you can use this URL
          const link = document.createElement('a');
          link.href = snippetDataUrl;
          link.download = 'highlighted_text_snippet.png';
          link.click();
        }
      };







      return (
        <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center', // Center horizontally
            justifyContent: 'center', // Center vertically
            minHeight: '100vh', // Full viewport height
            backgroundColor: '#f5f5f5', // Light background for better contrast
            padding: '50px',
        }}
        >
            <h2>Canvas</h2>





            
            {Array.from({ length: numPages }, (_, index)  => (
      <div key={index}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: 'auto', /* Allow it to grow */
          overflowY: 'auto', /* Enable scrolling */
        //maxHeight: '100vh', /* Prevent it from going off-screen */
          maxWidth: `794px`, // Limit width to A4 size
          //height: `1123px`,
          border: '1px solid #ddd',
          backgroundColor: '#fff',
          //flexGrow: 1, // Allow expansion
          transform: `scale(${1.1})`, //try different values between 1 and 2 to find optimal, also can change dynamically with touch input
          transformOrigin: 'center center', // Ensure it scales from the center
          position: 'relative', // Needed for absolute positioning of buttons
          marginBottom:'100px',
        }}
      >
        <canvas ref={(el) => (canvasRef.current[index] = el)} 
            width={A4_WIDTH}  // Explicit width
            height={A4_HEIGHT} // Explicit height
            onClick ={() => handleCanvasClick(index)}
        ></canvas>

        
        </div>
        ))}

        {/* Drawing Tools */}
        <div style={{ marginTop: '20px', textAlign: 'center',
        marginTop: '20px',
        textAlign: 'center',
        position: 'fixed', // <-- changed from 'absolute'
        top: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        zIndex: 10, // Ensures buttons stay above the canvas
      }}>
        <button onClick={() => setActiveTool('pen')}>Pen</button>
        <button onClick={() => setActiveTool('marker')}>Marker</button>
        <button onClick={() => setActiveTool('highlighter')}>Highlighter</button>
        <button onClick={() => setActiveTool('eraser')}>Eraser</button>
        <button onClick={() => setActiveTool('text')}>Text</button>
        <button onClick={() => setActiveTool('subhl')}>Special Highlighter</button>
      </div>
      {/* Hovering button on the left side */}
      <div
                style={{
                    position: 'fixed',
                    left: '150px', // Position from the left
                    top: '50%', // Center vertically
                    transform: 'translateY(-50%)', // Center vertically
                    backgroundColor: '#98a1f5',
                    color: '#fff',
                    padding: '15px 20px',
                    borderRadius: '50%',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                    cursor: 'pointer',
                    zIndex: 20, // Ensure it stays on top
                    transition: 'background-color 0.3s ease',
                }}
                onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#031b33';
                }}
                onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#98a1f5';
                }}
            >
                Hover Me
            </div>
        </div>



      )


};

export default CanvasEditor;
