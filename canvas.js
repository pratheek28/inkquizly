import React, { useRef, useState, useEffect } from 'react';
import * as fabric from 'fabric';
import { SketchPicker } from 'react-color';

const CanvasEditor = () => {
  const [canvases, setCanvases] = useState([]); // Single canvas
  const [brushColor, setBrushColor] = useState('#000000'); // Default to black marker
  const [activeTool, setActiveTool] = useState('point'); // Track the active tool
  const [activeCanvasIndex, setActiveCanvasIndex] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  // New state for floating icon options
  const [showFloatingOptions, setShowFloatingOptions] = useState(false);
  const canvasRef = useRef([]); // Ref for the canvas element
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

      canvas.on('mouse:down', () => handleClick(i));
      newCanvases.push(canvas);
    }
    setCanvases(newCanvases);
    return () => {
      newCanvases.forEach((canvas) => {
        canvas.dispose();
        canvas.off('mouse:down');
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

  const handleBrushColorChange = (color) => {
    setBrushColor(color.hex);
    if (canvases[activeCanvasIndex]) {
      canvases[activeCanvasIndex].freeDrawingBrush.color = color.hex;
    }
    setShowColorPicker(false);
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
          canvas.off('mouse:up');
          canvas.isDrawingMode = true;
          canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
          canvas.freeDrawingBrush.color = brushColor;
          canvas.freeDrawingBrush.width = 5;
        } else if (activeTool === 'marker') {
          canvas.off('mouse:up');
          canvas.isDrawingMode = true;
          canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
          canvas.freeDrawingBrush.color = brushColor;
          canvas.freeDrawingBrush.width = 10;
        } else if (activeTool === 'highlighter') {
          canvas.off('mouse:up');
          canvas.isDrawingMode = true;
          canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
          let bColor = hexToRgba(brushColor, 0.5);
          canvas.freeDrawingBrush.color = bColor;
          canvas.freeDrawingBrush.width = 15;
        } else if (activeTool === 'eraser') {
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
        } else if (activeTool === 'text') {
          canvas.isDrawingMode = false;
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
            underlineHighlightedRegion(highlightRect);
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
      multiplier: 1, // can increase this for better resolution
    });

    const base64Image = fullDataURL.split(',')[1];
    console.log("Base64 image:", base64Image);

    // Create a download link
    const link = document.createElement('a');
    link.href = fullDataURL;
    link.download = 'highlighted_region.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const underlineHighlightedRegion = async (rect, confidence = 0.5) => {
    const canvas = canvases[activeCanvasIndex];
    if (!canvas || !rect) return;

    // Find objects inside the highlight area
    const objectsInRegion = canvas.getObjects().filter((obj) => {
      const bounds = obj.getBoundingRect();
      return (
        bounds.left + bounds.width > rect.left &&
        bounds.top + bounds.height > rect.top &&
        bounds.left < rect.left + rect.width &&
        bounds.top < rect.top + rect.height
      );
    });

    // Try bolding text or making drawings thicker
    objectsInRegion.forEach((obj) => {
      if (obj instanceof fabric.Text || obj instanceof fabric.Textbox) {
        obj.set("fontWeight", "bold");
      } else {
        obj.set("strokeWidth", (obj.strokeWidth || 1) * 1.5);
      }
    });

    // Static underline right below the highlight box
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
    canvas.remove(rect); // remove the highlight box
    canvas.renderAll();

    // Confidence bar width (editable)
    const confidenceBarWidth = 100;
    const confidenceBar = new fabric.Rect({
      left: rect.left + rect.width + 10,
      top: rect.top + rect.height + 5,
      width: confidenceBarWidth,
      height: 10,
      fill: '#d3d3d3',
      selectable: false,
      evented: false,
    });

    // Confidence fill rectangle (green)
    const confidenceFill = new fabric.Rect({
      left: rect.left + rect.width + 10,
      top: rect.top + rect.height + 5,
      width: confidenceBarWidth * confidence,
      height: 10,
      fill: 'green',
      selectable: false,
      evented: false,
    });

    // Confidence percentage text
    const confidenceText = new fabric.Text(`${Math.round(confidence * 100)}%`, {
      left: rect.left + rect.width + confidenceBarWidth + 15,
      top: rect.top + rect.height + 5,
      fontSize: 12,
      selectable: false,
      evented: false,
    });

    const img = await fabric.FabricImage.fromURL('/inkai.png');
    console.log(img);
    img.scaleToHeight(30);
    img.scaleToWidth(30);
    img.set({
      left: rect.left + rect.width + 10, // Position next to underline
      top: rect.top + rect.height,       // Position below the confidence bar
      selectable: false,
      evented: true,
    });

    img.on('mousedown', (e) => {
      console.log('Image button was pressed');
      underline.set({
        stroke: 'red' // Change the underline color to red
      });
      canvas.renderAll();
    });
    canvas.add(img);
    canvas.renderAll();

    // Set up drag behavior for confidence bar (editable)
    confidenceBar.on('mousedown', (e) => {
      const startX = e.pointer.x;
      const startWidth = confidenceFill.width;

      const onMouseMove = (e) => {
        const deltaX = e.pointer.x - startX;
        const newWidth = Math.max(0, Math.min(confidenceBarWidth, startWidth + deltaX));
        confidenceFill.set({ width: newWidth });
        const newConfidence = newWidth / confidenceBarWidth;
        confidenceText.set({ text: `${Math.round(newConfidence * 100)}%` });
        canvas.renderAll();
      };

      const onMouseUp = () => {
        canvas.off('mouse:move', onMouseMove);
        canvas.off('mouse:up', onMouseUp);
      };

      canvas.on('mouse:move', onMouseMove);
      canvas.on('mouse:up', onMouseUp);
    });
    canvas.add(confidenceBar);
    canvas.add(confidenceFill);
    canvas.add(confidenceText);
    canvas.renderAll();
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
