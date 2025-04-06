import React, { useRef, useState, useEffect } from 'react';
import * as fabric from 'fabric';
import { SketchPicker } from 'react-color';

const CanvasEditor = () => {
  const [canvases, setCanvases] = useState([]); // Single canvas
  const [brushColor, setBrushColor] = useState('#000000'); // Default to black marker
  const [activeTool, setActiveTool] = useState('point'); // Track the active tool
  const [activeCanvasIndex, setActiveCanvasIndex] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
    const [response, setResponse] = useState(null);
  // New state for floating icon options
  const [showFloatingOptions, setShowFloatingOptions] = useState(false);
  const canvasRef = useRef([]); // Ref for the canvas element
    let confidenceLevels = []; // Make sure this is accessible in your scope
      const [showTextbox, setShowTextbox] = useState(false);
      const [diagramInput, setDiagramInput] = useState('');
      const [showGrid, setShowGrid] = useState(false);


  // State for floating icon (draggable)
  const [floatingIconPosition, setFloatingIconPosition] = useState({
    x: 150,
    y: window.innerHeight / 2,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;
  const numPages = 10;

  useEffect(() => {
    const newCanvases = [];
    for (let i = 0; i < numPages; i++) {
      const canvas = new fabric.Canvas(canvasRef.current[i], {
        width: A4_WIDTH,
        height: A4_HEIGHT,
        backgroundColor: null,
      });
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = 5;

      const handleClick = () => {
        setActiveCanvasIndex(i);
        console.log(`Canvas ${i} clicked`);
      };

      canvas.on('mouse:over', () => handleClick(i));
      newCanvases.push(canvas);
    }
    setCanvases(newCanvases);
    return () => {
      newCanvases.forEach((canvas) => {
        canvas.dispose();
        canvas.off('mouse:over');
      });
    };
  }, []);


    // Load saved value on mount
    useEffect(() => {
      const saved = localStorage.getItem('diagramInput');
      if (saved) setDiagramInput(saved);
    }, []);
  
    const handleDiagramClick = () => {
      setShowTextbox(true);
    };
  
    const handleTextboxBlur = () => {
      localStorage.setItem('diagramInput', diagramInput);
      setShowTextbox(false);
    };
  
    const handleEnterKey = () => {
      setShowTextbox(false);
      setShowGrid(true);
      // Optionally save the input value or perform other actions here.
    };


  const handleCanvasClick = (index) => {
    setActiveCanvasIndex(index);
    console.log('Canvas', index, 'clicked');
  };

  function hexToRgba(hex, alpha) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  useEffect(() => {
    canvases.forEach((canvas) => {
      if (canvas) {
        if (activeTool === 'pen') {
            canvas.off('mouse:down');
            canvas.off('mouse:move');
            canvas.off('mouse:up');
          canvas.isDrawingMode = true;
          canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
          canvas.freeDrawingBrush.color = brushColor;
          canvas.freeDrawingBrush.width = 5;
        } else if (activeTool === 'marker') {
            canvas.off('mouse:down');
            canvas.off('mouse:move');
            canvas.off('mouse:up');
          canvas.isDrawingMode = true;
          canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
          canvas.freeDrawingBrush.color = brushColor;
          canvas.freeDrawingBrush.width = 10;
        } else if (activeTool === 'highlighter') {
            canvas.off('mouse:down');
            canvas.off('mouse:move');
            canvas.off('mouse:up');
          canvas.isDrawingMode = true;
          canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
          let bColor = hexToRgba(brushColor, 0.5);
          canvas.freeDrawingBrush.color = bColor;
          canvas.freeDrawingBrush.width = 15;
        } else if (activeTool === 'eraser') {
            canvas.off('mouse:down');
            canvas.off('mouse:move');
            canvas.off('mouse:up');
          canvas.isDrawingMode = true;
          canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
          canvas.freeDrawingBrush.color = 'rgba(255, 169, 78, 0.5)';
          canvas.freeDrawingBrush.width = 5;
          canvas.on('mouse:down', function (e) {
            const pointer = canvas.getPointer(e.e);
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
                    break;
                  }
                }
              });
              canvas.renderAll();
            }
          });
        } else if (activeTool === 'point') {
            canvas.off('mouse:down');
              canvas.off('mouse:move');
              canvas.off('mouse:up');
            canvas.isDrawingMode = false;
          }
        
        
        
        else if (activeTool === 'text') {
          canvas.isDrawingMode = false;
          canvas.off('mouse:down');
                  canvas.off('mouse:move');
                  canvas.off('mouse:up');
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
              setActiveTool("point");
              canvas.setActiveObject(text);
              canvas.renderAll();
            }
          });
        } else if (activeTool === 'subhl') {
          // Special Highlighter tool handler
          canvas.isDrawingMode = false;
          let startX, startY;
          let highlightRect = null;

          const onMouseDown = (e) => {
            const pointer = canvas.getPointer(e.e);
            startX = pointer.x;
            startY = pointer.y;

            highlightRect = new fabric.Rect({
              left: startX,
              top: startY,
              width: 0,
              height: 0,
              fill: 'rgba(255, 255, 0, 0.3)',
              stroke: 'yellow',
              strokeWidth: 1,
              selectable: true,
              evented: true,
              hasControls: false, // no resize/rotate handles
  lockMovementX: true, // disable horizontal drag
  lockMovementY: true, // disable vertical drag
  hoverCursor: 'pointer',


            });

            canvas.add(highlightRect);
          };

          const onMouseMove = (e) => {
            if (!highlightRect) return;

            const pointer = canvas.getPointer(e.e);
            const width = pointer.x - startX;
            const height = pointer.y - startY;

            highlightRect.set({
              width: Math.abs(width),
              height: Math.abs(height),
              left: width < 0 ? pointer.x : startX,
              top: height < 0 ? pointer.y : startY,
            });

            canvas.renderAll();
          };

          const onMouseUp = () => {
            captureHighlightedRegion(highlightRect);
            console.log("logged");
            highlightRect = null;
            canvas.off('mouse:down', onMouseDown);
            canvas.off('mouse:move', onMouseMove);
            canvas.off('mouse:up', onMouseUp);
          };

          canvas.on('mouse:down', onMouseDown);
          canvas.on('mouse:move', onMouseMove);
          canvas.on('mouse:up', onMouseUp);
        } else if (activeTool === 'aihl') {
          // Special Highlighter tool handler
          canvas.isDrawingMode = false;
          let startX, startY;
          let highlightRect = null;

          const onMouseDown = (e) => {
            const pointer = canvas.getPointer(e.e);
            startX = pointer.x;
            startY = pointer.y;

            highlightRect = new fabric.Rect({
              left: startX,
              top: startY,
              width: 0,
              height: 0,
              fill: 'rgba(255, 255, 0, 0.3)',
              stroke: 'yellow',
              strokeWidth: 1,
              selectable: false,
              evented: false,
            });

            canvas.add(highlightRect);
          };

          const onMouseMove = (e) => {
            if (!highlightRect) return;

            const pointer = canvas.getPointer(e.e);
            const width = pointer.x - startX;
            const height = pointer.y - startY;

            highlightRect.set({
              width: Math.abs(width),
              height: Math.abs(height),
              left: width < 0 ? pointer.x : startX,
              top: height < 0 ? pointer.y : startY,
            });

            canvas.renderAll();
          };

          const onMouseUp = () => {
            const finalRect = highlightRect;
            underlineHighlightedRegion(finalRect);
            console.log("logged");
            highlightRect = null;
            canvas.off('mouse:down', onMouseDown);
            canvas.off('mouse:move', onMouseMove);
            canvas.off('mouse:up', onMouseUp);
          };

          canvas.on('mouse:down', onMouseDown);
          canvas.on('mouse:move', onMouseMove);
          canvas.on('mouse:up', onMouseUp);
        }
      }
    });
  }, [activeTool]);

 // Define these at the top level, outside any function
let isPopupOpen = false;
let popupRect = null;
let popupText = null;

const captureHighlightedRegion = (highlightRect) => {
  const canvas = canvases[activeCanvasIndex];
  if (!canvas) return;

  // Render the canvas and get full image data
  const fullDataURL = canvas.toDataURL({
    format: 'png',
    left: highlightRect.left,
    top: highlightRect.top,
    width: highlightRect.width,
    height: highlightRect.height,
    multiplier: 1,
  });

  const base64Image = fullDataURL.split(',')[1];
  console.log("Base64 image:", base64Image);

  function createPopup(message) {
    // Only create new ones if they don’t exist
    if (!popupRect && !popupText) {
      popupRect = new fabric.Rect({
        left: highlightRect.left +5,
        top: highlightRect.top - 105,
        width: 200,
        height: 100,
        fill: 'rgba(0, 0, 0, 0.7)',
        rx: 20,
        ry: 20,
        selectable: false,
        evented: false,
      });

      popupText = new fabric.Textbox(message || "sample message", {
        left: popupRect.left + 10,
        top: popupRect.top + 10,
        width: 200 - 10,
        fontSize: 10,
        fill: 'white',
        editable: false,
        selectable: false,
        evented: false,
      });

      canvas.add(popupRect, popupText);
      canvas.renderAll();
    }
  }

  function openPopup(message) {
    if (!isPopupOpen) {
      createPopup(message);
      isPopupOpen = true;
    }
  }

  function closePopup() {
    if (isPopupOpen && popupRect && popupText) {
      canvas.remove(popupRect);
      canvas.remove(popupText);
      popupRect = null;
      popupText = null;
      isPopupOpen = false;
      canvas.renderAll();
    }
  }

  console.log("rect=",highlightRect);

  let topics = "";

  // Highlight bolding
  const objectsInRegion = canvas.getObjects();

  objectsInRegion.forEach(obj => {
    if (obj instanceof fabric.Text || obj instanceof fabric.Textbox) {
      topics += obj.text; // Collect text from text objects
    } else {
    }
  });



  let data=base64Image;
   // Handle form submission to backend
   const handleSubmit = () => {
    fetch('http://127.0.0.1:5000/getdefinition', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ topic: topics ,img:data}) // Send data as an object with topic
    })
    .then(response => response.json())
    .then(data => {
      setResponse(data.definition);
      console.log("log is",data.definition);
      console.log("response is",response);

      // Display the text summary after submission
      highlightRect.on('mousedown', () => {
        console.log("rect is pressed");
        if (!isPopupOpen) {
          openPopup(data.definition);
        } else {
          closePopup();
        }
      });

  canvas.renderAll();
    })
    .catch(error => {
      console.error("Error:", error);
      setResponse("An Error occurred while submitting the form.");
    });
  };

  handleSubmit(); // Submit the data to the backend






  // Download the image
  const link = document.createElement('a');
  link.href = fullDataURL;
  link.download = 'highlighted_region.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  


  const captureHighlightedRegio = (highlightRect) => {
    const canvas = canvases[activeCanvasIndex];
    if (!canvas) return;

    // Render the canvas and get full image data
    const fullDataURL = canvas.toDataURL({
      format: 'png',
      left: highlightRect.left,
      top: highlightRect.top,
      width: highlightRect.width,
      height: highlightRect.height,
      multiplier: 1, // can increase this for better resolution
    });

    const base64Image = fullDataURL.split(',')[1];
    console.log("Base64 image:", base64Image);

    let isPopupOpen = false;
let popupRect = null;
let popupText = null;

    function createPopup(message) {
     // Create the background rectangle for the popup
  const popupRect = new fabric.Rect({
    left: highlightRect.left-5, // Position
    top: highlightRect.top+10,
    width: 400,
    height: 200,
    fill: 'rgba(0, 0, 0, 0.7)', // Semi-transparent background
    rx: 20, // Rounded corners
    ry: 20, 
    selectable: false, // Not selectable
    evented: false, // Not interactive
  });

  // Create the text inside the popup
  const popupText = new fabric.Textbox("sample message", {
    left: popupRect.left + 20, // Padding from the left
    top: popupRect.top + 20,   // Padding from the top
    width: 400 - 40,    // Adjust the width for padding
    fontSize: 20,
    fill: 'white',
    editable: false,  // Prevent the user from editing the text
    selectable: false,  // Make the text not selectable
    evented: false,  // Make it non-interactive
  });

  // Add the popup to the canvas
  canvas.add(popupRect, popupText);
  }

// Function to open the popup
function openPopup(message) {
  if (!isPopupOpen) {
    createPopup(message);
    isPopupOpen = true;
    canvas.renderAll();
  }
}

// Function to close the popup
function closePopup() {
  if (isPopupOpen) {
    canvas.remove(popupRect);
    canvas.remove(popupText);
    isPopupOpen = false;
    canvas.renderAll();
  }
}

highlightRect.on('mousedown', () => {
  console.log("rect is pressed");
  if (!isPopupOpen) {
    openPopup();
  } else {
    closePopup();
  }
  isPopupOpen = !isPopupOpen;
});





    // Create a download link
    const link = document.createElement('a');
    link.href = fullDataURL;
    link.download = 'highlighted_region.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

const underlineHighlightedRegion = async (rect, confidence = 0.5) => {
  console.log("im here yup");
  const canvas = canvases[activeCanvasIndex];
  if (!canvas || !rect) return;

  let topic = "";

  // Highlight bolding
  const objectsInRegion = canvas.getObjects().filter(obj => {
    const bounds = obj.getBoundingRect();
    return (
      bounds.left + bounds.width > rect.left &&
      bounds.top + bounds.height > rect.top &&
      bounds.left < rect.left + rect.width &&
      bounds.top < rect.top + rect.height
    );
  });

  objectsInRegion.forEach(obj => {
    if (obj instanceof fabric.Text || obj instanceof fabric.Textbox) {
      obj.set("fontWeight", "bold");
      obj.setCoords(); // Force update of bounding box after setting font weight
      topic += obj.text; // Collect text from text objects
    } else {
      obj.set("strokeWidth", (obj.strokeWidth || 1) * 1.5);
    }
  });

  // Underline
  const underline = new fabric.Line(
    [rect.left, rect.top + rect.height + 2, rect.left + rect.width, rect.top + rect.height + 2],
    {
      stroke: 'black',
      strokeWidth: 2,
      selectable: true,
      evented: true,
    }
  );
  canvas.add(underline);
  canvas.remove(rect);

  // Constants for slider
  const sliderMaxWidth = 100;
  const sliderHeight = 10;
  const sliderLeft = rect.left + rect.width + 45;
  const sliderTop = rect.top + rect.height - 5;

  // Slider
  const slider = new fabric.Rect({
    left: sliderLeft,
    top: sliderTop,
    width: sliderMaxWidth * confidence,
    height: sliderHeight,
    fill: 'green',
    hasBorders: false,
    hasControls: true,
    lockScalingY: true,
    lockMovementY: true,
    lockMovementX: true,
    lockRotation: true,
    originX: 'left',
    originY: 'top',
  });

  // Only allow right-side scaling
  slider.setControlsVisibility({
    mt: false, mb: false, ml: false, mr: true,
    tl: false, tr: false, bl: false, br: false,
    mtr: false,
  });

  // Confidence % text
  const confidenceText = new fabric.Text(`${Math.round(confidence * 100)}%`, {
    left: sliderLeft + slider.width + 10,
    top: sliderTop + slider.height / 2,
    fontSize: 12,
    originY: 'center',
    selectable: false,
    evented: false,
  });

  // Scaling behavior
  slider.on('scaling', function () {
    const scaledWidth = slider.width * slider.scaleX;

    const newWidth = Math.min(sliderMaxWidth, Math.max(1, scaledWidth));
    slider.set({
      scaleX: 1,
      width: newWidth,
      left: sliderLeft // lock left position
    });

    const newConfidence = newWidth / sliderMaxWidth;
    confidenceText.set({
      text: `${Math.round(newConfidence * 100)}%`,
      left: slider.left + newWidth + 10
    });

    // Store confidence for the current topic
    const existing = confidenceLevels.find(entry => entry.topic === topic);
    if (existing) {
      existing.confidence = newConfidence;
    } else {
      confidenceLevels.push({ topic, confidence: newConfidence });
    }

    canvas.requestRenderAll();
  });

  // Image button (for triggering additional functionality)
  const img = await fabric.Image.fromURL('/inkai.png');
  img.scaleToHeight(30);
  img.scaleToWidth(30);
  img.set({
    left: rect.left + rect.width + 10,
    top: rect.top + rect.height - 15,
    selectable: false,
    evented: true,
  });

  img.on('mousedown', () => {
    console.log('Image button was pressed with topic',topic);
    // Send topic to Python code here for summary
    let data = topic;

    // Handle form submission to backend
    const handleSubmit = () => {
      fetch('http://127.0.0.1:5000/getsummarized', {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ topic: data }) // Send data as an object with topic
      })
      .then(response => response.json())
      .then(data => {
        setResponse(data.summary);
        console.log("log is",data.summary);
        console.log("response is",response);

        // Display the text summary after submission
    const summ = new fabric.Textbox(data.summary, {
      left: rect.left,
      top: rect.top + rect.height + 10,
      width: 600,
      fontSize: 20,
    });
    canvas.add(summ);
    canvas.renderAll();
    underline.set({ stroke: 'red' });

    canvas.renderAll();
      })
      .catch(error => {
        console.error("Error:", error);
        setResponse("An Error occurred while submitting the form.");
      });
    };

    handleSubmit(); // Submit the data to the backend

  });

  canvas.add(slider, confidenceText, img);
  canvas.renderAll();

  console.log("Confidences:", confidenceLevels);
};

  const openColorPallet = () => {
    setShowColorPicker(true);
  };

  // Handlers for floating icon dragging
  const handleIconMouseDown = (e) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setFloatingIconPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Handler for icon click to toggle options
  const handleIconClick = (e) => {
    if (!isDragging) {
      // If the panel is currently open, reset grid and textbox states
      setShowFloatingOptions((prev) => {
        if (prev) {
          setShowGrid(false);
          setShowTextbox(false);
        }
        return !prev;
      });
    }
  };




  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '50px',
      }}
    >
      <h2>Canvas</h2>
      {Array.from({ length: numPages }, (_, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: 'auto',
            overflowY: 'auto',
            maxWidth: '794px',
            border: '1px solid #ddd',
            backgroundColor: '#fff',
            transform: `scale(${1.1})`,
            transformOrigin: 'center center',
            position: 'relative',
            marginBottom: '100px',
          }}
        >
          <canvas
            ref={(el) => (canvasRef.current[index] = el)}
            width={A4_WIDTH}
            height={A4_HEIGHT}
            onClick={() => handleCanvasClick(index)}
          ></canvas>
        </div>
      ))}

      {/* Drawing Tools Box with PNG Image Buttons */}
      <div
        style={{
          position: 'fixed',
          top: '10px',
          zIndex: 10,
          backgroundColor: '#fff',
          border: '2px solid #ddd',
          borderRadius: '8px',
          padding: '10px 20px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '20px',
            textAlign: 'center',
          }}
        >
          {/* Tool buttons (pen, marker, color pallet, etc.) */}
          <button
            onClick={() => setActiveTool('pen')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              transform: activeTool === 'pen' ? 'scale(1.8)' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (activeTool !== 'pen') {
                e.currentTarget.style.transform = 'scale(1.8)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTool !== 'pen') {
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            <img
              src="/pen_image.png"
              alt="Pen Tool"
              style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'scale-down' }}
            />
          </button>
          <button
            onClick={() => setActiveTool('marker')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              transform: activeTool === 'marker' ? 'scale(1.8)' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (activeTool !== 'marker') {
                e.currentTarget.style.transform = 'scale(1.8)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTool !== 'marker') {
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            <img
              src="/marker_image.png"
              alt="Marker Tool"
              style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'scale-down' }}
            />
          </button>
          <button
            onClick={openColorPallet}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              transform: activeTool === 'colorpallet' ? 'scale(1.8)' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (activeTool !== 'colorpallet') {
                e.currentTarget.style.transform = 'scale(1.8)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTool !== 'colorpallet') {
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            <img
              src="/colorpallet_image.png"
              alt="Color Pallet"
              style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'cover' }}
            />
          </button>
          <button
            onClick={() => setActiveTool('highlighter')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              transform: activeTool === 'highlighter' ? 'scale(1.8)' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (activeTool !== 'highlighter') {
                e.currentTarget.style.transform = 'scale(1.8)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTool !== 'highlighter') {
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            <img
              src="/highlighter_image.png"
              alt="Highlighter Tool"
              style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'scale-down' }}
            />
          </button>
          <button
            onClick={() => setActiveTool('eraser')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              transform: activeTool === 'eraser' ? 'scale(1.8)' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (activeTool !== 'eraser') {
                e.currentTarget.style.transform = 'scale(1.8)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTool !== 'eraser') {
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            <img
              src="/eraser_image.png"
              alt="Eraser Tool"
              style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'scale-down' }}
            />
          </button>
          <button
            onClick={() => setActiveTool('text')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              transform: activeTool === 'text' ? 'scale(1.8)' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (activeTool !== 'text') {
                e.currentTarget.style.transform = 'scale(1.8)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTool !== 'text') {
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            <img
              src="/texttool_image.png"
              alt="Text Tool"
              style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'cover' }}
            />
          </button>
          <button
            onClick={() => setActiveTool('aihl')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              transform: activeTool === 'aihl' ? 'scale(1.8)' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (activeTool !== 'aihl') {
                e.currentTarget.style.transform = 'scale(1.8)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTool !== 'aihl') {
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            <img
              src="/aihighlighter_image.png"
              alt="AI Highlighter Tool"
              style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'scale-down' }}
            />
          </button>
          <button
            onClick={() => setActiveTool('subhl')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              transform: activeTool === 'subhl' ? 'scale(1.8)' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (activeTool !== 'subhl') {
                e.currentTarget.style.transform = 'scale(1.8)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTool !== 'subhl') {
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            <img
              src="/magichighlighter_image.png"
              alt="Special Highlighter Tool"
              style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'scale-down' }}
            />
          </button>
        </div>
      </div>

      {/* Color Picker Popup */}
      {showColorPicker && (
        <div
          style={{
            position: 'absolute',
            top: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            backgroundColor: '#fff',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            padding: '10px',
          }}
        >
          <SketchPicker
            color={brushColor}
            onChange={(color) => {
              const newColorHex = color.hex;
              setBrushColor(newColorHex);
              if (canvases[activeCanvasIndex]) {
                const newColor =
                  activeTool === 'highlighter'
                    ? hexToRgba(newColorHex, 0.5)
                    : newColorHex;
                canvases[activeCanvasIndex].freeDrawingBrush.color = newColor;
              }
            }}
          />
          <button onClick={() => setShowColorPicker(false)}>Apply</button>
        </div>
      )}

      {/* Draggable Floating Icon */}
      <div
        style={{
          position: 'fixed',
          left: `${floatingIconPosition.x}px`,
          top: `${floatingIconPosition.y}px`,
          backgroundColor: '#98a1f5',
          color: '#fff',
          padding: '15px 20px',
          borderRadius: '50%',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          zIndex: 20,
          transition: 'background-color 0.3s ease',
          userSelect: 'none',
        }}
        onMouseDown={handleIconMouseDown}
        onClick={handleIconClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#031b33';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#98a1f5';
        }}
      >
        <img
          src="/inkai-removebg-preview.png"
          alt="Gemini Hover Bar"
          style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'scale-down' }}
        />
      </div>

      {/* Floating Options that appear when clicking the icon */}
      {showFloatingOptions && (
        <div
          style={{
            position: 'fixed',
            left: `${floatingIconPosition.x}px`,
            top: `${floatingIconPosition.y + 70}px`,
            transform: 'translate(-50%, 0)', // Center horizontally
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            zIndex: 25,
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <button onClick={handleDiagramClick} style={{ marginBottom: '10px' }}>
            <img
              src="/diagram_image.png"
              alt="Diagram Button"
              style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'scale-down' }}
            />
          </button>

          {showTextbox && (
            <input
              type="text"
              value={diagramInput}
              onChange={(e) => setDiagramInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleEnterKey();
                }
              }}
              onBlur={handleTextboxBlur}
              autoFocus
              placeholder="Enter Something Specific..."
              style={{
                padding: '5px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                marginBottom: '10px',
                width: '160px',
              }}
            />
          )}

          {showGrid && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gridTemplateRows: 'repeat(2, 1fr)',
                gap: '10px',
                marginTop: '10px',
              }}
            >
              <button
                style={{
                  border: '1px solid #ccc',
                  width: '80px',
                  height: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  cursor: 'pointer',
                }}
                onClick={() => console.log('Add image to Square 1')}
              >
                <img
                  src=""
                  alt="MCQ Button"
                  style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'scale-down' }}
                />
              </button>
              <button
                style={{
                  border: '1px solid #ccc',
                  width: '80px',
                  height: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  cursor: 'pointer',
                }}
                onClick={() => console.log('Add image to Square 2')}
              >
                <img
                  src=""
                  alt="MCQ Button"
                  style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'scale-down' }}
                />
              </button>
              <button
                style={{
                  border: '1px solid #ccc',
                  width: '80px',
                  height: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  cursor: 'pointer',
                }}
                onClick={() => console.log('Add image to Square 3')}
              >
                <img
                  src=""
                  alt="MCQ Button"
                  style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'scale-down' }}
                />
              </button>
              <button
                style={{
                  border: '1px solid #ccc',
                  width: '80px',
                  height: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  cursor: 'pointer',
                }}
                onClick={() => console.log('Add image to Square 4')}
              >
                <img
                  src=""
                  alt="MCQ Button"
                  style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'scale-down' }}
                />
              </button>
            </div>
          )}

          <button onClick={() => console.log('MCQ button clicked')}>
            <img
              src="/mcq_image.png"
              alt="MCQ Button"
              style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'scale-down' }}
            />
          </button>
        </div>
      )}
    </div>
  );
};

export default CanvasEditor;



