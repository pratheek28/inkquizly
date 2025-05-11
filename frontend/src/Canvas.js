/* Access-Control-Allow-Origin */
/* global TimestampTrigger */
import React, { useRef, useState, useEffect } from 'react';
import * as fabric from 'fabric';
import { SketchPicker } from 'react-color';
import { useNavigate, useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import * as pdfjsLib from 'pdfjs-dist/build/pdf';
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const CanvasEditor = () => {
  const [canvases, setCanvases] = useState([]); // Single canvas
  const [brushColor, setBrushColor] = useState('#000000'); // Default to black marker
  const [activeTool, setActiveTool] = useState('pen'); // Track the active tool
  const [activeCanvasIndex, setActiveCanvasIndex] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [response, setResponse] = useState(null);
  const [undoStack, setUndoStack] = useState([]); // undo stack
  const [redoStack, setRedoStack] = useState([]); // redo stack
  const [showToolInfo, setShowToolInfo] = useState(false); // tool info

  // New state for floating icon options
  const [showFloatingOptions, setShowFloatingOptions] = useState(false);
  const [showPomodoroRect, setShowPomodoroRect] = useState(false); // New state for Pomodoro rectangle
  const canvasRef = useRef([]); // Ref for the canvas element
  //let confidenceLevels = []; // Make sure this is accessible in your scope
  const [confidenceLevels, setConfidenceLevels] = useState([]);
  const [showTextbox, setShowTextbox] = useState(false);
  const [diagramInput, setDiagramInput] = useState('');
  const [showGrid, setShowGrid] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(1500); // 25 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [searchimg, setsearch] = useState(false);

  const [first, setfirst] = useState(''); //setting for study plan
  const [second, setsecond] = useState('');
  const [third, setthird] = useState('');
  const [fourth, setfourth] = useState('');

  const location = useLocation();
  const [isNew, setIsNew] = useState(location.state?.isNew);
  const [loading, setLoading] = useState(false);
  const [loadtext, setLoadingText] = useState('Letting the ink settle.');

  //const noteID= "note-1"
  const noteID = location.state?.noteID; // Get the notebook name from state
  const key = location.state?.key; // Get the notebook name from state
  const file = location.state?.file; // Get the notebook name from state
  const user = '1';

  // State for floating icon (draggable)
  const [floatingIconPosition, setFloatingIconPosition] = useState({
    x: 150,
    y: window.innerHeight / 2,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const shouldUndo= useRef(false); // Track the last object added to the canvas


  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;
  const numPages = 10;

  //setIsNew(location.state?.isNew);

  useEffect(() => {
    const newCanvases = [];

    if (true) {
      setLoading(true);
      const handleSubmitload = () => {
        console.log('here loading');
        fetch('https://inkquizly.onrender.com/load', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ note: noteID }),
        })
          .then((response) => response.json())
          .then((data) => {
            data.data.forEach((canvasData, index) => {
              console.log(`Canvas index ${index}:`, canvasData);

              // Example: parse if needed
              const parsed = JSON.parse(canvasData);
              console.log('Parsed canvas:', parsed);
              const canvasElement = canvasRef.current[index];

              // Check if the canvas element is valid and exists
              if (!canvasElement) {
                console.error(
                  `Canvas element at index ${index} is not available!`
                );
              }
              if (canvasElement?.fabric) {
                canvasElement.fabric.dispose();
              }

              const canvas = new fabric.Canvas(canvasElement, {
                width: A4_WIDTH,
                height: A4_HEIGHT,
                backgroundColor: null, // Set background color to white
              });

              let jsonString = canvasData;

              // Load JSON content first and then add your custom objects
              canvas.clear();
              canvas.loadFromJSON(JSON.parse(jsonString)).then(() => {
                canvas.renderAll();

                const objects = canvas.getObjects();

                canvas.isDrawingMode = true;
                canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
                canvas.freeDrawingBrush.color = brushColor;
                canvas.freeDrawingBrush.width = 5;

                canvas.on('path:created', (e) => {
                  // only when in pen mode
                  if (activeTool !== 'pen') return;

                  // grab the raw Fabric.Path
                  const raw = e.path || e.target;
                  const pts = raw.path.map((cmd) => ({ x: cmd[1], y: cmd[2] }));
                  const p0 = pts[0];
                  const pN = pts[pts.length - 1];

                  // line-distance formula
                  const A = pN.y - p0.y;
                  const B = p0.x - pN.x;
                  const C = pN.x * p0.y - p0.x * pN.y;
                  const maxDist = pts.reduce((mx, pt) => {
                    return Math.max(
                      mx,
                      Math.abs(A * pt.x + B * pt.y + C) / Math.hypot(A, B)
                    );
                  }, 0);

                  // reference to just this canvas
                  const cv = raw.canvas;

                  // STRAIGHT LINES
                  if (maxDist <= 5) {
                    cv.remove(raw);
                    cv.add(
                      new fabric.Line([p0.x, p0.y, pN.x, pN.y], {
                        stroke: cv.freeDrawingBrush.color,
                        strokeWidth: cv.freeDrawingBrush.width,
                        selectable: false,
                      })
                    );
                    cv.requestRenderAll();
                    return;
                  }

                  // Compute centroid & average radius for circle detection
                  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
                  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
                  const radii = pts.map((p) => Math.hypot(p.x - cx, p.y - cy));
                  const rAvg = radii.reduce((s, r) => s + r, 0) / radii.length;
                  const maxDev = Math.max(
                    ...radii.map((r) => Math.abs(r - rAvg))
                  );

                  // CIRCLE
                  const circleTolerance = 2; // max radial dev for a full circle
                  if (maxDev <= circleTolerance) {
                    cv.remove(raw);
                    cv.add(
                      new fabric.Circle({
                        left: cx - rAvg,
                        top: cy - rAvg,
                        radius: rAvg,
                        stroke: raw.stroke,
                        strokeWidth: raw.strokeWidth,
                        fill: '',
                        selectable: false,
                      })
                    );
                    cv.renderAll();
                    return;
                  }
                });

                // new "saveState"
                canvas.on('object:added', (e) => {
                  if (e.target.__fromRedo) {
                    delete e.target.__fromRedo;
                    return;
                  }
                  // Check if the object's color is rgba(255, 169, 78, 0.5)
                  if (e.target.stroke === 'rgba(255, 169, 78, 0.5)') {
                    return; // Ignore this object if it matches the color
                  }

                  // mark how it got here
                  e.target.__lastAction = 'added';
                  setUndoStack((u) => [...u, e.target]);
                  setRedoStack([]); // clear redo on a true new add
                });

                canvas.on('object:removed', (e) => {
                  if (e.target.__fromUndo) {
                    delete e.target.__fromUndo;
                    return;
                  }
                  // Check if the object's color is rgba(255, 169, 78, 0.5)
                  if (e.target.stroke === 'rgba(255, 169, 78, 0.5)') {
                    console.log('match');
                    return; // Ignore this object if it matches the color
                  }

                  // mark how it got here
                  e.target.__lastAction = 'removed';
                  setUndoStack((u) => [...u, e.target]);
                  setRedoStack([]); // clear redo on a true remove
                });
                // Listen for when objects are added to the canvas
// canvas.on('path:created', onObjectAdded);
canvas.on('path:created', function(event) {
  const path = event.path;
  console.log("Path created",shouldUndo, path);

  if (shouldUndo.current) {

      canvas.remove(path);
      canvas.renderAll();
      console.log("Removed fast-drawn path.");
    shouldUndo.current = false;
  } else {
    setlastobject(path); // Track normally if not undoing
  }
});

                const handleClick = () => {
                  setActiveCanvasIndex(index);
                  console.log(`Canvas ${index} clicked`);
                };

                canvas.upperCanvasEl.addEventListener('touchstart', (e) => {
                  const touch = e.touches[0];

                  // Some browsers support this:
                  if (touch.touchType && touch.touchType !== 'stylus') {
                    e.preventDefault(); // Ignore fingers/palms
                    return;
                  }

                  // Fallback: allow only touches with a small radius (rough stylus heuristic)
                  if (touch.radiusX > 10 || touch.radiusY > 10) {
                    e.preventDefault(); // Likely palm/finger
                    return;
                  }

                  // At this point, likely a stylus touch
                  console.log('Stylus input detected');
                });

                //canvas.on('mouse:over', () => handleClick(index));
                // canvas.on('mouse:down', () => handleClick(index));
                //canvas.on('pointer:down', () => handleClick(index));

                // canvas.on('touchstart', handleClick);

                objects.forEach((obj) => {
                  console.log('object:', obj);
                  if (obj.fill?.replace(/\s/g, '') === 'rgb(23,225,23)') {
                    console.log('object found');
                    obj.set({
                      hasBorders: false,
                      hasControls: true,
                      lockScalingY: true,
                      lockMovementY: true,
                      lockMovementX: true,
                      lockRotation: true,
                      originX: 'left',
                      originY: 'top',
                    });
                    obj.setControlsVisibility({
                      mt: false,
                      mb: false,
                      ml: false,
                      mr: true,
                      tl: false,
                      tr: false,
                      bl: false,
                      br: false,
                      mtr: false,
                    });
                    let maxleft = obj.left;

                    const topicindex = topicsindexes.current;
                    topicsindexes.current++; // persists across re-renders

                    const scaledWidth = obj.width * obj.scaleX;
                    const newWidth = Math.min(100, Math.max(1, scaledWidth));

                    const newConfidence = newWidth / 100;

                    setConfidenceLevels((prev) => {
                      const updated = [...prev];
                      updated[topicindex] = newConfidence;
                      return updated;
                    });

                    obj.on('scaling', function () {
                      const scaledWidth = obj.width * obj.scaleX;
                      const newWidth = Math.min(100, Math.max(1, scaledWidth));

                      obj.set({
                        scaleX: 1,
                        width: newWidth,
                        left: maxleft, // lock left position
                      });

                      const newConfidence = newWidth / 100;

                      setConfidenceLevels((prev) => {
                        const updated = [...prev];
                        updated[topicindex] = newConfidence;
                        return updated;
                      });

                      // // Store confidence for the current topic
                      // const existing = confidenceLevels.find(entry => entry.topic === topic);
                      // if (existing) {
                      //   existing.confidence = newConfidence;
                      // } else {
                      //   confidenceLevels.push({ topic, confidence: newConfidence });
                      // }

                      canvas.requestRenderAll();
                    });
                  }
                  if (
                    obj.fill?.replace(/\s/g, '') === 'transparent' &&
                    obj.stroke === 'gray'
                  ) {
                    obj.set({
                      selectable: false,
                      evented: false,
                    });
                    canvas.requestRenderAll();
                  }
                });

                canvas.renderAll();

                console.log('Canvas loaded yes!');
                setLoading(false);
              });

              // Debug logging to confirm canvas rendering
              canvas.renderAll();
              console.log('Canvasref=', canvasRef.current[index]);

              newCanvases.push(canvas);
            });
            setCanvases(newCanvases);
            
            if (newCanvases.length > 0) {
              setActiveCanvasIndex(0);
            }
          }).then(()=>{
          })
          .catch((error) => {
            console.error('Error:', error);
            setResponse('An Error occurred while submitting the form.');
          });
      };

      handleSubmitload(); // Submit the data to the backend

      // handleSubmit(); // Submit the data to the backend
    } else {
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
      setIsNew(false);
    }

    setCanvases(newCanvases);
    
    return () => {
      newCanvases.forEach((canvas) => {
        // remove the undo‐snapshot listener
        // remove any other listeners
        canvas.off('mouse:over');
        canvas.off('mouse:down');
        // finally dispose
        canvas.dispose();
      });
    };
  }, []);

  const downloadPDF = () => {
    setIsLoading2(true); // Start the loading spinner
    // Simulate a delay for the loading spinner (e.g., 3 seconds)
    setTimeout(() => {
      setIsLoading2(false);
    }, 5000); // 3000ms = 3 seconds

    const doc = new jsPDF(); // Create a new jsPDF document

    // Iterate over each canvas and capture it as an image
    canvasRef.current.forEach((canvasEl, index) => {
      if (canvasEl) {
        html2canvas(canvasEl).then((canvasImage) => {
          const imageDataUrl = canvasImage.toDataURL('image/png'); // Get image data URL

          // Add the image to the PDF
          if (index > 0) {
            doc.addPage(); // Add a new page for each canvas
          }
          doc.addImage(imageDataUrl, 'PNG', 0, 0,794 *0.26,1123 *0.26); // Position and size of the image

          // If it's the last canvas, trigger download
          if (index === canvasRef.current.length - 1) {
            doc.save(noteID+'.pdf'); // Download the PDF
          }
        });
      }
    });
  };

  const [notetitle, setnotetitle] = useState('Notebook 1');

  useEffect(() => {
    console.log("USE:",canvases," and ",file)
    if (canvases.length > 0 && file) {
      handlePDFUpload(file);
    }
  }, [canvases,loading]);

  const handlePDFUpload = async (file) => {
    console.log("trying pdf");
    if(file=='') return;
    if (!file) return;
  
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
  
    reader.onload = async () => {
      const typedarray = new Uint8Array(reader.result);
  
      const pdf = await pdfjsLib.getDocument(typedarray).promise;
  
      for (let i = 0; i < pdf.numPages; i++) {
        console.log(`Canvas ${i}:`, canvases[i]);
console.log('Is fabric.Canvas now?', canvases[i] instanceof fabric.Canvas);
        const page = await pdf.getPage(i + 1);
        const viewport = page.getViewport({ scale: 2 });
  
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = viewport.width;
        tempCanvas.height = viewport.height;
  
        const context = tempCanvas.getContext('2d');
  
        await page.render({ canvasContext: context, viewport }).promise;
  
        const imageData = tempCanvas.toDataURL();
  
        // Now apply this imageData as a background image for your Fabric canvas
        if (canvases[i]) {
          console.log("going to set",imageData);
          const img = await fabric.FabricImage.fromURL(imageData);
            canvases[i].backgroundImage = img;
            const scaleX = 794 / img.width;
            const scaleY = 1123 / img.height;
            img.scaleX = scaleX;
            img.scaleY = scaleY;
            canvases[i].requestRenderAll(); // or renderAll()
            console.log("img set");
        }
      }
    };
  };
  

  useEffect(() => {
    // const averageConfidence = confidenceLevels.reduce((sum, val) => sum + val, 0) / confidenceLevels.length;
    const averageConfidence = parseFloat(
      (
        (confidenceLevels.reduce((sum, val) => sum + val, 0) /
          confidenceLevels.length) *
        100
      ).toFixed(2)
    );
    setnotetitle('📊: ' + averageConfidence + '%');
    console.log('set conf=', averageConfidence);
    console.log('array is:', confidenceLevels);
  }, [confidenceLevels]);

  async function notifyAt() {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      alert('Please allow notifications!');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    if (!registration) {
      alert('Service worker not registered!');
      return;
    }

    const delayInSeconds = 5;
    const timestamp = Date.now() + delayInSeconds * 1000;

    registration.showNotification('Take a Break!', {
      body: 'Your 25 minute study session is over',
      icon: './logo192.png',
      showTrigger: new TimestampTrigger(timestamp), // Schedule in the future
    });
  }
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((reg) => {
          console.log('Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.error('Service Worker registration failed:', err);
        });
    });
  }

  canvases.forEach((canvas, index) => {
    canvas.upperCanvasEl.addEventListener('pointerdown', (e) => {
      console.log("radius is:",e.width," and:",e.height);
    //   const isPalm =
    //   (e.width > 30 || e.height > 30); // Adjust this threshold if needed

    // if (isPalm) {
    //   e.preventDefault(); // Prevent unwanted behavior
    //   e.stopImmediatePropagation(); // <- This is crucial
    //   canvas.isDrawingMode = false;
    //   console.log(`Palm detected on canvas ${index} — ignoring input.`);
    //   return;
    // }
    // if(canvas.isDrawingMode === true){
    // canvas.isDrawingMode = true;
    // }

      setActiveCanvasIndex(index);
      console.log(`Canvas ${index} clicked`);
    },true);
  });

  let lastPos = null;
  let lastTime = null;
  const [lastObject,setlastobject]= useState(null); // Track the last object added to the canvas


  
  canvases.forEach((canvas, index) => {
    let speed=0;
    const el = canvas.upperCanvasEl;
  
    el.addEventListener('pointerdown', (e) => {
      // Reset tracking variables when the pointer is pressed
      lastPos = { x: e.clientX, y: e.clientY };
      lastTime = e.timeStamp;
    });
  
    el.addEventListener('pointermove', (e) => {
      if (!lastPos) return; // Ignore if no previous pointer position
  
      // Calculate distance between current and last position
      const distance = Math.sqrt(
        (e.clientX - lastPos.x) ** 2 + (e.clientY - lastPos.y) ** 2
      );
  
      // Calculate time difference between current and last pointermove event
      const timeDifference = e.timeStamp - lastTime;
  
      // If timeDifference is greater than 0 (to avoid division by zero)
      if (timeDifference > 0) {
        speed = distance / timeDifference; // Speed in pixels per millisecond (px/ms)
        console.log(`Drawing speed: ${speed} pixels/ms`);

  
        // You can add a threshold to detect if the speed is too fast/slow
        const threshold = 7; // For example, 0.1 px/ms (adjust as needed)
        if (speed > threshold) {
          console.log("Drawing too fast!");
          // You can handle cases of "too fast" drawing here if necessary
        }
      }
  
      // Update the last position and time for the next move
      lastPos = { x: e.clientX, y: e.clientY };
      lastTime = e.timeStamp;
    });
  
    el.addEventListener('pointerup', () => {
      
      // Reset when pointer is released
      lastPos = null;
      lastTime = null;
      console.log("speed here:",speed);
      if (speed > 7) {
        console.log("Drawing too fast, undoing line...",lastObject);
        shouldUndo.current = true;
        console.log("set as",shouldUndo);
      }
    });
  
    el.addEventListener('pointercancel', () => {
      // Reset on pointer cancel
      lastPos = null;
      lastTime = null;
    });
  });
  

  // This should be added when creating new objects (like paths, lines, etc.)
function onObjectAdded(event) {
  console.log("object added",event.path);
  setlastobject(event.path);
}

  
  
  
  
  

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = canvasRef.current.indexOf(entry.target);
          if (entry.isIntersecting) {
            setActiveCanvasIndex(index);
            console.log(`Canvas ${index} is in view`);
          }
        });
      },
      {
        threshold: 0.5, // Trigger when 50% of the canvas is visible
      }
    );
  
    // Observe each canvas element
    canvasRef.current.forEach((canvasEl) => {
      if (canvasEl) {
        observer.observe(canvasEl);
      }
    });
  
    // Cleanup observer on unmount or when canvasesRef changes
    return () => {
      canvasRef.current.forEach((canvasEl) => {
        if (canvasEl) {
          observer.unobserve(canvasEl);
        }
      });
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = ''; // Some browsers need this to trigger the confirmation
      saveCanvases(); // Save canvases before refresh/close
    };

    const handlePopState = (event) => {
      event.preventDefault();
      event.returnValue = ''; // Some browsers need this to trigger the confirmation
      saveCanvases(); // Save canvases when navigating back/forward
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [canvases]);

  const [isSaving, setIsSaving] = useState(false);


  const saveCanvases = () => {
    canvases.forEach((canvas) => {
      const objectsToRemove = [];

      canvas.getObjects().forEach((obj) => {
        if (obj.type === 'image' && obj.getSrc) {
          const src = obj.getSrc();

          // Check for local-only sources
          const isLocalImage =
            src.startsWith('data:') ||
            src.startsWith('blob:') ||
            src.includes('localhost') ||
            src.includes('inkquizly.tech') ||
            src.includes('inkquizly.onrender.com');

          if (isLocalImage) {
            objectsToRemove.push(obj);
          }
        }
        if (obj.customType === 'confidence') {
          objectsToRemove.push(obj);
        }
      });

      // Remove all the matched local images
      objectsToRemove.forEach((obj) => canvas.remove(obj));

      // Optional: force render update
      canvas.renderAll();
    });

    const indices = canvases.map((canvas, index) => index);
    const datas = canvases.map(
      (canvas) => JSON.stringify(canvas.toJSON())
      // .replace(/'/g, '`')
      // .replace(/[\x00-\x1F\x7F]/g, '')
      // .replace(/\\"(.*?)\\"/g, (_, inner) => `\`${inner}\``)
      // .replace(/\\n/g, '\\\\n')
    );

    console.log('HELLOOOOdatasin:', datas);
    console.log('userkey:', key);

    const canvasesData = canvases.map((canvas, index) => ({
      note: noteID,
      indx: index,
      data: JSON.stringify(canvas.toJSON())
        .replace(/'/g, '`')
        .replace(/[\x00-\x1F\x7F]/g, '')
        .replace(/\\\"(.*?)\\\"/g, (_, inner) => `\`${inner}\``)
        .replace(/\\n/g, '\\\\n'),
      use: user,
    }));
    console.log('noteitle:', notetitle);

    const handleSubmit = () => {
      console.log('here saving');
      fetch('https://inkquizly.onrender.com/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note: noteID,
          index: indices,
          dat: datas,
          user: key, //IMPORTANT
          //user: "5f3fbb27-e377-4344-a805-b9ebd0a93311",
          conf: notetitle,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          setResponse(data.definition);
          console.log('log is', data.definition);
          console.log('response is', response);
          setIsSaving(false);
        })
        .catch((error) => {
          console.error('Error:', error);
          setResponse('An Error occurred while submitting the form.');
        });
    };

    handleSubmit(); // Submit the data to the backend

    canvasesData.forEach((canvasData) => {
      console.log(canvasData.data);
      console.log('nexttt');
    });
    console.log(canvasesData);
  };

  const handleMCQButtonClick = () => {
    const canvas = canvases[activeCanvasIndex];
    if (canvas) {
      const mcqrect = new fabric.Rect({
        left: 100,
        top: 100,
        width: 500,
        height: 300,
        fill: 'blue',
        stroke: 'black',
        strokeWidth: 2,
        selectable: false,
      });
      canvas.add(mcqrect);

      const qtxt = new fabric.Textbox('Q.', {
        left: mcqrect.left + 10,
        top: mcqrect.top + 10,
        width: mcqrect.width - 20,
        fontSize: 16,
        fill: 'black',
        editable: true,
        backgroundColor: 'transparent',
      });
      canvas.add(qtxt);

      const ch1 = new fabric.Rect({
        left: mcqrect.left + 20,
        top: mcqrect.top + 50,
        width: 460,
        height: 40,
        fill: 'grey',
        stroke: 'black',
        strokeWidth: 2,
        selectable: true,
      });
      canvas.add(ch1);

      const ch1text = new fabric.Textbox('A.', {
        left: ch1.left + 10,
        top: ch1.top + 10,
        width: ch1.width - 20,
        fontSize: 16,
        fill: 'black',
        editable: true,
        backgroundColor: 'transparent',
      });
      canvas.add(ch1text);

      const ch2 = new fabric.Rect({
        left: mcqrect.left + 20,
        top: mcqrect.top + 100,
        width: 460,
        height: 40,
        fill: 'grey',
        stroke: 'black',
        strokeWidth: 2,
        selectable: true,
      });
      canvas.add(ch2);
      const ch2text = new fabric.Textbox('B.', {
        left: ch2.left + 10,
        top: ch2.top + 10,
        width: ch2.width - 20,
        fontSize: 16,
        fill: 'black',
        editable: true,
        backgroundColor: 'transparent',
      });
      canvas.add(ch2text);

      const ch3 = new fabric.Rect({
        left: mcqrect.left + 20,
        top: mcqrect.top + 150,
        width: 460,
        height: 40,
        fill: 'grey',
        stroke: 'black',
        strokeWidth: 2,
        selectable: true,
      });
      canvas.add(ch3);
      const ch3text = new fabric.Textbox('C.', {
        left: ch3.left + 10,
        top: ch3.top + 10,
        width: ch3.width - 20,
        fontSize: 16,
        fill: 'black',
        editable: true,
        backgroundColor: 'transparent',
      });
      canvas.add(ch3text);
      canvas.renderAll();

      const next = new fabric.Rect({
        left: mcqrect.left + 420,
        top: mcqrect.top + 210,
        width: 50,
        height: 20,
        fill: 'grey',
        stroke: 'black',
        strokeWidth: 2,
        selectable: true,
      });
      canvas.add(next);

      const prev = new fabric.Rect({
        left: mcqrect.left + 20,
        top: mcqrect.top + 210,
        width: 50,
        height: 20,
        fill: 'grey',
        stroke: 'black',
        strokeWidth: 2,
        selectable: true,
      });
      canvas.add(prev);

      // const handleSubmit = () => {
      //   fetch('http://127.0.0.1:5000/getmcq', {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json"
      //     },
      //     body: JSON.stringify({ topic: data }) // Send data as an object with topic
      //   })
      //   .then(response => response.json())
      //   .then(data => {
      //     setResponse(data.summary);
      //     console.log("log is",data.item1);
      //     console.log("response is",data.item2);

      //   })
      //   .catch(error => {
      //     console.error("Error:", error);
      //     setResponse("An Error occurred while submitting the form.");
      //   });
      // };

      // handleSubmit(); // Submit the data to the backend
    } else {
      console.log('No active canvas available to add rectangles.');
    }
  };

  //let img1='';
  const [img1, setimg1] = useState(null);
  const [img2, setimg2] = useState(null);
  const [img3, setimg3] = useState(null);
  const [img4, setimg4] = useState(null);
  // Load image lookup on change
  useEffect(() => {
    if (!diagramInput) {
      return; // Don't run if diagramInput is null, undefined, or empty
    }
    let data = diagramInput;
    console.log('diagram data:', data);

    // Handle form submission to backend
    const handleSubmit = () => {
      fetch('https://inkquizly.onrender.com/getimages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: data }), // Send data as an object with topic
      })
        .then((response) => response.json())
        .then((data) => {
          setResponse(data.summary);
          console.log('log is', data.item1);
          console.log('response is', data.item2);

          // Display the text summary after submission
          setimg1(data.item1);
          setimg2(data.item2);
          setimg3(data.item3);
          setimg4(data.item4);
          console.log('img1:', img1);
          console.log('img2:', img2);
          console.log('img3:', img3);
          console.log('img4:', img4);
        })
        .catch((error) => {
          console.error('Error:', error);
          setResponse('An Error occurred while submitting the form.');
        });
    };

    handleSubmit(); // Submit the data to the backend
  }, [searchimg]);

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

  // Add this useEffect for the countdown timer:
  useEffect(() => {
    let timerId;
    if (isTimerRunning) {
      timerId = setInterval(() => {
        setPomodoroTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerId);
            setIsTimerRunning(false);

            // 🌟 Notify and reset
            Notification.requestPermission().then((permission) => {
              console.log('requesting notif');
              if (permission === 'granted') {
                navigator.serviceWorker.ready.then((registration) => {
                  registration.showNotification('Take a Break! ⏰', {
                    body: 'Your 25-minute study session is over. Time to relax!',
                    icon: './inkai-removebg-preview.png',
                    actions: [
                      {
                        action: 'snooze',
                        title: 'Take a 5 min break',
                        icon: './inkai-removebg-preview.png',
                      },
                    ],
                  });
                });
              } else {
                alert('Please enable notifications to get Pomodoro alerts.');
              }
            });

            setTimeout(() => {
              setPomodoroTime(1500);
            }, 100);

            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [isTimerRunning]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        //     console.log("Notification snoozed for 5 minutes");
        if (event.data && event.data.type === 'snooze') {
          const delay = event.data.delay || 300000; // 5 mins default

          setTimeout(() => {
            navigator.serviceWorker.getRegistration().then((registration) => {
              if (registration) {
                registration.showNotification('Snooze Over! ⏰', {
                  body: 'Your break is over, time to get back to work!',
                  icon: './inkai-removebg-preview.png',
                });
              }
            });
          }, delay);
        }
      });
    }
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes < 10 ? '0' + minutes : minutes}:${
      secs < 10 ? '0' + secs : secs
    }`;
  };

  const handlePomodoroClick = () => {
    // const canvas = canvases[activeCanvasIndex];

    // const handleSubmit = () => {
    //   console.log("here");
    //   fetch('http://127.0.0.1:5000/getschedule', {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json"
    //     },
    //     body: JSON.stringify({ days: numDays ,confidence: conf})
    //   })
    //   .then(response => response.json())
    //   .then(data => {
    //     setResponse(data.definition);
    //     console.log("log is",data.definition);
    //     console.log("response is",response);

    //     setfirst(data.one);
    //     setsecond(data.two);
    //     setthird(data.three);
    //     setfourth(data.four);

    // canvas.renderAll();
    //   })
    //   .catch(error => {
    //     console.error("Error:", error);
    //     setResponse("An Error occurred while submitting the form.");
    //   });
    // };

    // handleSubmit(); // Submit the data to the backend
    if (showPomodoroRect === true) {
      setShowPomodoroRect(false);
    } else {
      setShowPomodoroRect(true);
    }
  };

  const handleCanvasClick = (index) => {
    setActiveCanvasIndex(index);
    console.log('Canvas', index, 'clicked');
  };

  function hexToRgba(hex, alpha) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('');
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
          let bColor = (brushColor === "#000000") ? "rgba(255, 255, 0, 0.5)" : hexToRgba(brushColor, 0.5);
          canvas.freeDrawingBrush.color = bColor;
          canvas.freeDrawingBrush.width = 25;
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
        } else if (activeTool === 'text') {
          canvas.off('mouse:down');
          canvas.off('mouse:move');
          canvas.off('mouse:up');
          canvas.isDrawingMode = false;
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
              setActiveTool('point');
              canvas.setActiveObject(text);
              canvas.renderAll();
            }
          });
        } else if (activeTool === 'subhl') {
          canvas.off('mouse:down');
          canvas.off('mouse:move');
          canvas.off('mouse:up');
          // Special Highlighter tool handler
          canvas.isDrawingMode = false;
          let startX, startY;
          let highlightRect = null;
          console.log('prevstartx=', startX);

          // Save the previous state of all objects (for later restoration)
          const previousStates = canvas.getObjects().map((obj) => ({
            obj: obj,
            lockMovementX: obj.lockMovementX,
            lockMovementY: obj.lockMovementY,
            selectable: obj.selectable,
          }));

          // Disable movement and selection for all objects
          canvas.getObjects().forEach((obj) => {
            if (obj) {
              obj.lockMovementX = true;
              obj.lockMovementY = true;
              obj.selectable = false;
            }
          });
          canvas.renderAll(); // Ensure the canvas reflects these changes

          const onMouseDownsub = (e) => {
            if (highlightRect) {
              // Reset the previous highlightRect before creating a new one
              console.log('there exists highlightrect so deleting');
              canvas.remove(highlightRect); // Remove the old rectangle
              highlightRect = null; // Reset the variable
            }
            const pointer = canvas.getPointer(e.e);
            startX = pointer.x;
            console.log('startx=', startX);
            startY = pointer.y;
            console.log('starty=', startY);

            highlightRect = new fabric.Rect({
              left: pointer.x,
              top: pointer.y,
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
            console.log(
              'Capture region sent initial:',
              highlightRect.left,
              highlightRect.top,
              highlightRect.width,
              highlightRect.height
            );

            canvas.add(highlightRect);
          };

          const onMouseMovesub = (e) => {
            if (!highlightRect) return;

            const pointer = canvas.getPointer(e.e);
            let width = pointer.x - startX;
            let height = pointer.y - startY;

            console.log('width:', width);
            console.log('height:', height);
            console.log('pointer:', pointer.x, pointer.y);
            console.log('startx:', startX, startY);

            // Update the rectangle's dimensions and position based on pointer movement
            highlightRect.set({
              width: Math.abs(width), // Always use positive width
              height: Math.abs(height), // Always use positive height
              left: width < 0 ? pointer.x : startX, // If width is negative, adjust left
              top: height < 0 ? pointer.y : startY, // If height is negative, adjust top
              selectable: true,
              evented: true,
            });
            canvas.renderAll();

            console.log(
              'Capture region sent:',
              highlightRect.left,
              highlightRect.top,
              highlightRect.width,
              highlightRect.height
            );
            console.log('highlight:', highlightRect);

            // Final render to update the canvas with the latest changes
            canvas.renderAll();
          };

          const onMouseUpsub = () => {
            if (!highlightRect) return;

            // Ensure the latest properties are up-to-date before capturing
            const rect = highlightRect.getBoundingRect(true);
            console.log(
              'Capture region sent rn:',
              highlightRect.left,
              highlightRect.top,
              highlightRect.width,
              highlightRect.height
            );
            console.log(
              'Capture region sent rn after:',
              rect.left,
              rect.top,
              rect.width,
              rect.height
            );

            console.log('highlight:', highlightRect);

            // Capture the highlighted region
            captureHighlightedRegion(highlightRect);
            setActiveTool('point');
            console.log('sub logged');

            // Reset and clean up
            highlightRect = null;
            canvas.off('mouse:down', onMouseDownsub);
            canvas.off('mouse:move', onMouseMovesub);
            canvas.off('mouse:up', onMouseUpsub);
            canvas.off('touch:down', onMouseDownsub);
            canvas.off('touch:move', onMouseMovesub);
            canvas.off('touch:up', onMouseUpsub);

            // Re-enable movement and selection for all objects after the tool is used
            canvas.getObjects().forEach((obj, index) => {
              const previousState = previousStates[index];
              if (previousState && previousState.obj) {
                // Ensure the object exists
                previousState.obj.lockMovementX = previousState.lockMovementX;
                previousState.obj.lockMovementY = previousState.lockMovementY;
                previousState.obj.selectable = previousState.selectable;
              }
            });
            canvas.renderAll(); // Ensure the canvas reflects these changes
          };

          canvas.on('mouse:down', onMouseDownsub);
          canvas.on('mouse:move', onMouseMovesub);
          canvas.on('mouse:up', onMouseUpsub);
          canvas.on('pointerdown', (e) => {
            e.preventDefault();
            console.log('touchstart triggered');
            onMouseDownsub(e);
          });
          canvas.on('pointermove', (e) => {
            e.preventDefault();
            onMouseMovesub(e);
          });
          canvas.on('pointerup', (e) => {
            e.preventDefault();
            onMouseUpsub(e);
          });
        } else if (activeTool === 'aihl') {
          canvas.off('mouse:down');
          canvas.off('mouse:move');
          canvas.off('mouse:up');
          // Special Highlighter tool handler
          canvas.isDrawingMode = false;
          let startX, startY;
          let highlightRect = null;
          console.log('prevstartx=', startX);

          const onMouseDown = (e) => {
            const pointer = canvas.getPointer(e.e);
            startX = pointer.x;
            console.log('startx=', startX);
            startY = pointer.y;
            console.log('starty=', startY);

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
            console.log('logged higlight');
            highlightRect = null;
            canvas.off('mouse:down', onMouseDown);
            canvas.off('mouse:move', onMouseMove);
            canvas.off('mouse:up', onMouseUp);
            setActiveTool('point');
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

  const checkIfRectIsOnCanvas = (highlightRect) => {
    for (let i = 0; i < canvases.length; i++) {
      const canvas = canvases[i];
  
      // Get canvas boundaries
      const canvasLeft = canvas.viewportTransform[4]; // left position of the canvas
      const canvasTop = canvas.viewportTransform[5];  // top position of the canvas
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
  
      // Get the bounding box of the highlightRect
      const rectLeft = highlightRect.left;
      const rectTop = highlightRect.top;
      const rectRight = rectLeft + highlightRect.width;
      const rectBottom = rectTop + highlightRect.height;
  
      // Check if the highlightRect is within the canvas bounds
      if (
        rectLeft >= canvasLeft &&
        rectTop >= canvasTop &&
        rectRight <= canvasLeft + canvasWidth &&
        rectBottom <= canvasTop + canvasHeight
      ) {
        // The rectangle is inside this canvas
        console.log(`Highlight rect is on canvas ${i}`);
        return i; // Return the index of the canvas
      }
    }
  
    return null; // If no canvas contains the highlight rect
  };
  

  const captureHighlightedRegion = (highlightRect) => {
    console.log("active index:",activeCanvasIndex);
    const canvas = canvases[activeCanvasIndex];

    if (!canvas) return;

    // Render the canvas and get full image data
    canvas.renderAll();

    const rect = highlightRect.getBoundingRect(true);

    console.log(
      'Capture region in funct:',
      rect.left,
      rect.top,
      rect.width,
      rect.height
    );

    const fullDataURL = canvas.toDataURL({
      format: 'png',
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      multiplier: 1,
    });

    const base64Image = fullDataURL.split(',')[1];
    console.log('Base64 image:', base64Image);

    function createPopup(message) {
      // Only create new ones if they don’t exist
      if (!popupRect && !popupText) {
        popupRect = new fabric.Rect({
          left: rect.left + 5,
          top: rect.top - 105,
          width: 200,
          height: 100,
          fill: 'rgba(0, 0, 0, 0.7)',
          rx: 20,
          ry: 20,
          selectable: false,
          evented: false,
        });

        popupText = new fabric.Textbox(message || 'sample message', {
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

    console.log('rect=', highlightRect);

    let topics = '';
    setLoadingText('Analyzing with context.');
    setLoading(true);

    // Highlight bolding
    const objectsInRegion = canvas.getObjects();

    objectsInRegion.forEach((obj) => {
      if (obj instanceof fabric.Text || obj instanceof fabric.Textbox) {
        topics += obj.text; // Collect text from text objects
      } else {
      }
    });

    let data = base64Image;
    // Handle form submission to backend
    const handleSubmit = () => {
      fetch('https://inkquizly.onrender.com/getdefinition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: topics, img: data }), // Send data as an object with topic
      })
        .then((response) => response.json())
        .then((data) => {
          setResponse(data.definition);
          console.log('log is', data.definition);
          console.log('response is', response);

          // Display the text summary after submission
          highlightRect.on('mousedown', () => {
            console.log('rect is pressed');
            if (!isPopupOpen) {
              openPopup(data.definition);
            } else {
              closePopup();
            }
          });
          setLoading(false);
          canvas.renderAll();
        })
        .catch((error) => {
          console.error('Error:', error);
          setResponse('An Error occurred while submitting the form.');
        });
    };

    handleSubmit(); // Submit the data to the backend

    // //Download the image
    // const link = document.createElement('a');
    // link.href = fullDataURL;
    // link.download = 'highlighted_region.png';
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
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
    console.log('Base64 image:', base64Image);

    let isPopupOpen = false;
    let popupRect = null;
    let popupText = null;

    function createPopup(message) {
      // Create the background rectangle for the popup
      const popupRect = new fabric.Rect({
        left: highlightRect.left - 5, // Position
        top: highlightRect.top + 10,
        width: 400,
        height: 200,
        fill: 'rgba(0, 0, 0, 0.7)', // Semi-transparent background
        rx: 20, // Rounded corners
        ry: 20,
        selectable: false, // Not selectable
        evented: false, // Not interactive
      });

      // Create the text inside the popup
      const popupText = new fabric.Textbox('sample message', {
        left: popupRect.left + 20, // Padding from the left
        top: popupRect.top + 20, // Padding from the top
        width: 400 - 40, // Adjust the width for padding
        fontSize: 20,
        fill: 'white',
        editable: false, // Prevent the user from editing the text
        selectable: false, // Make the text not selectable
        evented: false, // Make it non-interactive
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
      console.log('rect is pressed');
      if (!isPopupOpen) {
        openPopup();
      } else {
        closePopup();
      }
      isPopupOpen = !isPopupOpen;
    });

    // // Create a download link
    // const link = document.createElement('a');
    // link.href = fullDataURL;
    // link.download = 'highlighted_region.png';
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
  };

  const openImage = async (url) => {
    const canvas = canvases[activeCanvasIndex];
    try {
      // Wait until the image is loaded and create an image object
      const img = await fabric.FabricImage.fromURL(url);
      // img.set({
      //   left: 100, // Adjust as needed
      //   top: 100, // Adjust as needed
      //   angle: 0, // Optionally, you can set an initial angle
      //   selectable: true,
      //   evented: true,
      //   scaleX: scale,
      //   scaleY: scale,
      // });
      img.set({ crossOrigin: 'anonymous' });

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Calculate the scaling factor to fit the image in the canvas
      const scaleX = (canvasWidth * 0.8) / img.width;
      const scaleY = (canvasHeight * 0.8) / img.height;
      const scale = Math.min(scaleX, scaleY); // Choose the smaller scale to fit the image inside

      // Optionally, set position or scale the image
      img.set({
        left: 100, // Adjust as needed
        top: 100, // Adjust as needed
        angle: 0, // Optionally, you can set an initial angle
        selectable: true,
        evented: true,
        scaleX: scale,
        scaleY: scale,
      });

      // Add the image to the canvas and render it
      canvas.add(img);
      setActiveTool('point');
      canvas.renderAll();
    } catch (error) {
      console.error('Error loading image:', error);
    }
  };

  const topicsindexes = useRef(0);

  const underlineHighlightedRegion = async (rect, confidence = 0.5) => {
    console.log('im here yup');
    console.log("active index:",activeCanvasIndex);

    const canvas = canvases[activeCanvasIndex];

    if (!canvas || !rect) return;

    // let topic = '';

    canvas.renderAll();

    const Rect = rect.getBoundingRect(true);

    const fullDataURL = canvas.toDataURL({
      format: 'png',
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      multiplier: 1,
    });

    const topic = fullDataURL.split(',')[1];
    //const topic = fullDataURL;
    console.log('Base64 image:', topic);

    // Highlight bolding
    // const objectsInRegion = canvas.getObjects().filter((obj) => {
    //   const bounds = obj.getBoundingRect();
    //   return (
    //     bounds.left + bounds.width > rect.left &&
    //     bounds.top + bounds.height > rect.top &&
    //     bounds.left < rect.left + rect.width &&
    //     bounds.top < rect.top + rect.height
    //   );
    // });

    const topicindex = topicsindexes.current;
    topicsindexes.current++; // persists across re-renders

    // objectsInRegion.forEach((obj) => {
    //   if (obj instanceof fabric.Text || obj instanceof fabric.Textbox) {
    //     obj.set('fontWeight', 'bold');
    //     obj.setCoords(); // Force update of bounding box after setting font weight
    //     topic += obj.text; // Collect text from text objects
    //     // topicindex=topicsindexes;
    //     // topicsindexes++;
    //   } else {
    //     obj.set('strokeWidth', (obj.strokeWidth || 1) * 1.5);
    //   }
    // });

    // Underline
    const underline = new fabric.Line(
      [
        rect.left,
        rect.top + rect.height + 2,
        rect.left + rect.width,
        rect.top + rect.height + 2,
      ],
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

    const sliderBorder = new fabric.Rect({
      left: sliderLeft,
      top: sliderTop,
      width: sliderMaxWidth,
      height: sliderHeight,
      fill: 'transparent',
      stroke: 'gray',
      strokeWidth: 1,
      selectable: false,
      evented: false,
      originX: 'left',
      originY: 'top',
    });
    canvas.add(sliderBorder);

    // Slider
    const slider = new fabric.Rect({
      left: sliderLeft,
      top: sliderTop,
      width: sliderMaxWidth * confidence,
      height: sliderHeight,
      fill: 'rgb(23, 225, 23)',
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
      mt: false,
      mb: false,
      ml: false,
      mr: true,
      tl: false,
      tr: false,
      bl: false,
      br: false,
      mtr: false,
    });

    const scaledWidth = slider.width * slider.scaleX;
    const newWidth = Math.min(100, Math.max(1, scaledWidth));

    const newConfidence = newWidth / 100;

    setConfidenceLevels((prev) => {
      const updated = [...prev];
      updated[topicindex] = newConfidence;
      return updated;
    });

    // // Confidence % text
    // const confidenceText = new fabric.Text(`${Math.round(confidence * 100)}%`, {
    //   left: sliderLeft + slider.width + 10,
    //   top: sliderTop + slider.height / 2,
    //   fontSize: 12,
    //   originY: 'center',
    //   selectable: false,
    //   evented: false,
    //   customType: 'confidence',
    // });

    // Scaling behavior
    // slider.on('scaling', function () {
    //   const scaledWidth = slider.width * slider.scaleX;

    //   const newWidth = Math.min(sliderMaxWidth, Math.max(1, scaledWidth));
    //   slider.set({
    //     scaleX: 1,
    //     width: newWidth,
    //     left: sliderLeft // lock left position
    //   });

    //   const newConfidence = newWidth / sliderMaxWidth;
    //   confidenceText.set({
    //     text: `${Math.round(newConfidence * 100)}%`,
    //     left: slider.left + newWidth + 10
    //   });

    //   // Store confidence for the current topic
    //   const existing = confidenceLevels.find(entry => entry.topic === topic);
    //   if (existing) {
    //     existing.confidence = newConfidence;
    //   } else {
    //     confidenceLevels.push({ topic, confidence: newConfidence });
    //   }

    //   canvas.requestRenderAll();
    // });

    slider.on('scaling', function () {
      const scaledWidth = slider.width * slider.scaleX;
      const newWidth = Math.min(sliderMaxWidth, Math.max(1, scaledWidth));

      slider.set({
        scaleX: 1,
        width: newWidth,
        left: sliderLeft, // lock left position
      });

      const newConfidence = newWidth / sliderMaxWidth;

      //confidenceLevels[topicindex] = newConfidence;
      setConfidenceLevels((prev) => {
        const updated = [...prev];
        updated[topicindex] = newConfidence;
        console.log('index=', topicindex);
        return updated;
      });

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
      console.log('Image button was pressed with topic', topic);
      // Send topic to Python code here for summary
      let data = topic;

      const loadingGif = document.getElementById('loading-gif');
      setLoadingText('Crafting your response with neural ink.');
      setLoading(true);
      canvas.remove(img);

      // Handle form submission to backend
      const handleSubmit = () => {
        fetch('https://inkquizly.onrender.com/getsummarized', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ topic: data }), // Send data as an object with topic
        })
          .then((response) => response.json())
          .then((data) => {
            setResponse(data.summary);
            console.log('log is', data.summary);
            console.log('response is', response);

            // Display the text summary after submission
            const summ = new fabric.Textbox(data.summary, {
              left: rect.left,
              top: rect.top + rect.height + 10,
              width: 600,
              fontSize: 20,
            });
            canvas.add(summ);
            canvas.renderAll();
            underline.set({ stroke: 'rgb(40, 2, 143)' });
            // if (loadingImage) {
            //   canvas.remove(loadingImage);
            // }
            setLoading(false);

            canvas.renderAll();
          })
          .catch((error) => {
            console.error('Error:', error);
            setResponse('An Error occurred while submitting the form.');
          });
      };

      handleSubmit(); // Submit the data to the backend
    });

    canvas.add(slider, img);
    canvas.renderAll();

    console.log('Confidences:', confidenceLevels);
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

  // Handlers for floating icon dragging (touch)
  const handleIconTouchStart = (e) => {
    e.preventDefault(); // Prevents default touch action (like scrolling)
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top,
    });

    // Add touchmove and touchend listeners for dragging
    const handleTouchMove = (moveEvent) => {
      if (!isDragging) return;
      const newX = moveEvent.touches[0].clientX - dragOffset.x;
      const newY = moveEvent.touches[0].clientY - dragOffset.y;

      setFloatingIconPosition({ x: newX, y: newY });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
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
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
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

  const boxStyle = {
    flex: 1,
    backgroundColor: 'white',
    border: '1px solid black',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);


  const goHome = () => {
    setIsLoading(true); // Start the loading spinner
    saveCanvases();

    // Simulate a delay for the loading spinner (e.g., 3 seconds)
    setTimeout(() => {
      navigate('/AccountDashboard'); // Navigate after the delay
      setIsLoading(false);
    }, 3000); // 3000ms = 3 seconds
  };

  const handleUndoRedo = (action) => {
    const canvas = canvases[activeCanvasIndex];
    if (!canvas) return;

    if (action === 'undo') {
      if (undoStack.length === 0) return;
      const last = undoStack[undoStack.length - 1];
      setUndoStack((u) => u.slice(0, -1));
      setRedoStack((r) => [...r, last]);
      // flag so removal listener skips this
      last.__fromUndo = true;

      // if it was added → remove; if removed → re-add
      if (last.__lastAction === 'added') {
        canvas.remove(last);
      } else {
        canvas.add(last);
      }
      canvas.renderAll();
    } else if (action === 'redo') {
      if (redoStack.length === 0) return;
      const toRestore = redoStack[redoStack.length - 1];
      setRedoStack((r) => r.slice(0, -1));
      setUndoStack((u) => [...u, toRestore]);
      // flag so addition listener skips this
      toRestore.__fromRedo = true;

      // if it was added → re-add; if removed → remove again
      if (toRestore.__lastAction === 'added') {
        canvas.add(toRestore);
      } else {
        canvas.remove(toRestore);
      }
      canvas.renderAll();
    }
  };



  useEffect(() => {
    // Only run autosave if canvases have data
    if (canvases.length === 0) {
      console.log("RETURNING");
      return;}
      console.log("autosave registered");
    const intervalId = setInterval(() => {
      console.log("autosaving now");
      setIsSaving(true);
      saveCanvases();
    }, 5 * 60 * 1000);  // 5 minutes interval
  
    return () => clearInterval(intervalId);
  }, [canvases,loading]);

  function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360; // Keep it in 0–359 range
    return `hsl(${hue}, 70%, 80%)`; // Light pastel color
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh',
        color: '#fff',
        padding: '50px',
        justifyContent:
          'center' /* Change this to align content from the top */,
        marginTop: '10900px' /* Add this to push the content down */,
      }}
    >
      {/* Home Button */}

      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: 'rgba(0, 16, 120, 0.9)', // dark gray with transparency
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center', // <--- CENTER everything horizontally
          gap: '10px', // Space between items
          minWidth: '150px',
          textAlign: 'center', // <--- CENTER the text itself too
        }}
      >
        <button
          onClick={goHome}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: isLoading ? '#6c757d' : '#007bff', // Gray while saving
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer',
          }}
          disabled={isLoading} // Prevent clicking multiple times
        >
          {isLoading ? 'Saving...' : 'Your Dashboard'}
        </button>

        <div style={{ fontSize: '14px' }}>
          <strong>
            <h2>{noteID.split('⚪️')[1] || noteID}</h2>
          </strong>
          {noteID.split('⚪️')[0] !== '' && (
            <h4 style={{ color: stringToColor(noteID.split('⚪️')[0]) }}>
              📂 {noteID.split('⚪️')[0] || noteID}
            </h4>
          )}
        </div>


        <div style={{ fontSize: '14px' }}>
          <strong>{notetitle}</strong>
          {isSaving && (
            <h5 style={{ color: 'lime' }}>
              💾  Autosaving..
            </h5>
          )}
        </div>
        <button
            onClick={() => downloadPDF()}
            style={{
            padding: '5px',
            backgroundColor: '#20C997', // Gray while saving
            color: '#fff',
            border: 'none',
            borderRadius: '20px',
            fontSize: '16px',
            cursor: 'pointer',
          }}
          disabled={isLoading2} // Prevent clicking multiple times
        >
          {isLoading2 ? 'Downloading..' : '⬇️'}
        </button>
      </div>

      {Array.from({ length: numPages }, (_, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '95%',
            height: 'auto',
            overflowY: 'auto',
            maxWidth: '794px',
            border: '1px solid #ddd',
            backgroundColor: '#fff',
            //transform: `scale(${1.1})`,
            // canvas.setZoom(1.1); // Use this to zoom in
            transformOrigin: 'center center',
            position: 'relative',
            marginBottom: '5px',
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
      {/* Loading GIF overlay */}
      {loading && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 1000,
          }}
        >
          <img
            src="/load.gif"
            alt="Loading..."
            style={{
              display: 'block',
              margin: '0 auto',
            }}
          />
          <p
            style={{
              marginTop: '10px',
              color: '#333',
              fontFamily: '"Helvatica", Courier, verdana', // Change font here
              fontSize: '15px',
            }}
          >
            <b>{loadtext}</b>
          </p>
        </div>
      )}

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
            color: 'black',
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
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '4px',
                objectFit: 'scale-down',
              }}
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
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '4px',
                objectFit: 'scale-down',
              }}
            />
          </button>
          <div
  style={{
    width: '50px',  // Set the width of the div
    height: '50px', // Set the height of the div
    display: 'flex',
    flexWrap: 'wrap', // Allow wrapping of buttons to the next row
    gap: '10px', // Spacing between buttons
    justifyContent: 'center', // Center the buttons horizontally
    alignItems: 'center', // Center the buttons vertically
  }}
>
  {/* Button 1 */}
  <button
onClick={() => {
  setBrushColor("#5271ff");

  // Loop through all canvases and apply the color
  canvases.forEach((canvas) => {
    if (canvas) {
      const newColorHex = "#5271ff";  // or the color you are updating
      const newColor =
        activeTool === 'highlighter'
          ? hexToRgba(newColorHex, 0.5)
          : newColorHex;

      canvas.freeDrawingBrush.color = newColor;
    }
  });
}}

            style={{
      background: 'none',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      transition: 'transform 0.2s',
      transform: activeTool === 'colorpallet1' ? 'scale(1.8)' : 'scale(1)',
      width: '20px',
      height: '20px',
    }}
    onMouseEnter={(e) => {
      if (activeTool !== 'colorpallet1') {
        e.currentTarget.style.transform = 'scale(1.8)';
      }
    }}
    onMouseLeave={(e) => {
      if (activeTool !== 'colorpallet1') {
        e.currentTarget.style.transform = 'scale(1)';
      }
    }}
  >
    <img
      src="/blue.png"
      alt="Color Pallet 1"
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '4px',
        objectFit: 'cover',
      }}
    />
  </button>

  {/* Button 2 */}
  <button

onClick={() => {
  setBrushColor("#00bf63");

  // Loop through all canvases and apply the color
  canvases.forEach((canvas) => {
    if (canvas) {
      const newColorHex = "#00bf63";  // or the color you are updating
      const newColor =
        activeTool === 'highlighter'
          ? hexToRgba(newColorHex, 0.5)
          : newColorHex;

      canvas.freeDrawingBrush.color = newColor;
    }
  });
}}
            style={{
      background: 'none',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      transition: 'transform 0.2s',
      transform: activeTool === 'colorpallet2' ? 'scale(1.8)' : 'scale(1)',
      width: '20px',
      height: '20px',
    }}
    onMouseEnter={(e) => {
      if (activeTool !== 'colorpallet2') {
        e.currentTarget.style.transform = 'scale(1.8)';
      }
    }}
    onMouseLeave={(e) => {
      if (activeTool !== 'colorpallet2') {
        e.currentTarget.style.transform = 'scale(1)';
      }
    }}
  >
    <img
      src="/green.png"
      alt="Color Pallet 2"
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '4px',
        objectFit: 'cover',
      }}
    />
  </button>

  {/* Button 3 */}
  <button
onClick={() => {
  setBrushColor("#ff3131");

  // Loop through all canvases and apply the color
  canvases.forEach((canvas) => {
    if (canvas) {
      const newColorHex = "#ff3131";  // or the color you are updating
      const newColor =
        activeTool === 'highlighter'
          ? hexToRgba(newColorHex, 0.5)
          : newColorHex;

      canvas.freeDrawingBrush.color = newColor;
    }
  });
}}
            style={{
      background: 'none',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      transition: 'transform 0.2s',
      transform: activeTool === 'colorpallet3' ? 'scale(1.8)' : 'scale(1)',
      width: '20px',
      height: '20px',
    }}
    onMouseEnter={(e) => {
      if (activeTool !== 'colorpallet3') {
        e.currentTarget.style.transform = 'scale(1.8)';
      }
    }}
    onMouseLeave={(e) => {
      if (activeTool !== 'colorpallet3') {
        e.currentTarget.style.transform = 'scale(1)';
      }
    }}
  >
    <img
      src="/red.png"
      alt="Color Pallet 3"
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '4px',
        objectFit: 'cover',
      }}
    />
  </button>

  {/* Button 4 */}
  <button
    onClick={openColorPallet}
    style={{
      background: 'none',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      transition: 'transform 0.2s',
      transform: activeTool === 'colorpallet4' ? 'scale(1.8)' : 'scale(1)',
      width: '20px',
      height: '20px',
    }}
    onMouseEnter={(e) => {
      if (activeTool !== 'colorpallet4') {
        e.currentTarget.style.transform = 'scale(1.8)';
      }
    }}
    onMouseLeave={(e) => {
      if (activeTool !== 'colorpallet4') {
        e.currentTarget.style.transform = 'scale(1)';
      }
    }}
  >
    <img
      src="/colorpallet_image.png"
      alt="Color Pallet 4"
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '4px',
        objectFit: 'cover',
      }}
    />
  </button>
</div>

          <button
            onClick={() => setActiveTool('highlighter')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              transform:
                activeTool === 'highlighter' ? 'scale(1.8)' : 'scale(1)',
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
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '4px',
                objectFit: 'scale-down',
              }}
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
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '4px',
                objectFit: 'scale-down',
              }}
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
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '4px',
                objectFit: 'cover',
              }}
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
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '4px',
                objectFit: 'scale-down',
              }}
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
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '4px',
                objectFit: 'scale-down',
              }}
            />
          </button>
          <button
            onClick={() => setActiveTool('point')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              transform: activeTool === 'point' ? 'scale(1.8)' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (activeTool !== 'point') {
                e.currentTarget.style.transform = 'scale(1.8)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTool !== 'point') {
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            <img
              src="https://cdn3.iconfinder.com/data/icons/hand-gesture/512/cursor_press_button_index_finger_pointer_point_click_touch_gesture-512.png"
              alt="Pointer Tool"
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '4px',
                objectFit: 'scale-down',
              }}
            />
          </button>
          <button
            onClick={() => handleUndoRedo('undo')}
            disabled={!undoStack.length}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: undoStack.length ? 'pointer' : 'not-allowed',
            }}
          >
            <img
              src="/Undo_Button.png"
              alt="Undo"
              style={{ width: '40px', height: '40px', objectFit: 'contain' }}
            />
          </button>

          <button
            onClick={() => handleUndoRedo('redo')}
            disabled={!redoStack.length}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: redoStack.length ? 'pointer' : 'not-allowed',
            }}
          >
            <img
              src="/Redo_Button.png"
              alt="Redo"
              style={{ width: '40px', height: '40px', objectFit: 'contain' }}
            />
          </button>
          <button
            title="TOOL INFO"
            onClick={() => setShowToolInfo(prev => !prev)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer'
            }}
          >
            <img
              src="/tool_help_icon.png"
              alt="Tool Info"
              style={{ width: '40px', height: '40px', objectFit: 'contain' }}
            />
          </button>
        </div>
        {/* ↓ pop-up rendered immediately beneath the toolbar row */}
        {showToolInfo && (
          <div
            style={{
              marginTop: '20px',
              backgroundColor: '#f9f9f9',
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '8px 12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              maxWidth: '1000px',
              color: '#333',
              fontSize: '10px',
              fontWeight: 'bold'
            }}
          >
            <p style={{ margin: 0, whiteSpace: 'pre' }}>
              PEN               MARKER            PALLET              HLTR               ERASER             TEXT            TITLE-HLTR        AI-HLTR           POINTER          UNDO            REDO         
            </p>
          </div>
        )}
      </div>



      {/* Color Picker Popup */}
      {showColorPicker && (
        <div
          style={{
            position: 'fixed',
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
              canvases.forEach((canvas) => {
                if (canvas) {
                  canvas.freeDrawingBrush.color = newColor;
                }
              });
            }}
          />
          <button onClick={() => setShowColorPicker(false)}>Apply</button>
        </div>
      )}

      {/* Draggable Floating Icon */}
      <div
        style={{
          position: 'fixed',
          //left: `${floatingIconPosition.x}px`,
          left: `${Math.max(
            floatingIconPosition.x,
            window.innerWidth / 2 + 430
          )}px`, // Ensure it stays in the right half
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
        onTouchStart={handleIconTouchStart} // Add touch start listener for tablets
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
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '4px',
            objectFit: 'scale-down',
            pointerEvents: 'none', // Prevent the image from interfering with the drag
          }}
        />
      </div>

      {/* Fixed-position Pomodoro Rectangle with Timer and 6 inner rectangles */}
      {showPomodoroRect && (
        <div
          style={{
            position: 'fixed',
            left: '10px',
            top: '100px',
            width: '220px',
            height: '500px',
            backgroundColor: 'rgb(4, 8, 75)',
            border: '2px solid black',
            borderRadius: '20px', // <-- Curved edges
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)', // <-- Soft shadow
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '10px',
            color: 'white', // <-- Better contrast text
            fontFamily: 'Arial, sans-serif', // <-- Cleaner font
            transition: 'all 0.3s ease', // <-- Smooth visual feel
          }}
        >
          {/* Timer display */}
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            {formatTime(pomodoroTime)}
          </div>

          {/* Container for 6 inner rectangles */}
          <div
            style={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
              marginTop: '10px',
              marginBottom: '10px',
            }}
          >
            {/* Start button */}
            <button
              onClick={() => setIsTimerRunning(true)}
              disabled={isTimerRunning || pomodoroTime === 0}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                cursor: isTimerRunning ? 'not-allowed' : 'pointer',
              }}
            >
              Start
            </button>
            {/* Session 1 */}
            <div
              style={{
                height: '30px',
                fontWeight: 'bold',
                textAlign: 'center',
              }}
            >
              Study Session 1
            </div>
            <textarea
              style={boxStyle}
              value={first}
              onChange={(e) => setfirst(e.target.value)} // Update state on typing
              placeholder="Type goals for your 1st 25 min study session..."
            />

            {/* Session 2 */}
            <div
              style={{
                height: '30px',
                fontWeight: 'bold',
                textAlign: 'center',
              }}
            >
              Study Session 2
            </div>
            <textarea
              style={boxStyle}
              value={second}
              onChange={(e) => setsecond(e.target.value)} // Update state on typing
              placeholder="Type goals for your 2nd 25 min study session..."
            />

            {/* Session 3 */}
            <div
              style={{
                height: '30px',
                fontWeight: 'bold',
                textAlign: 'center',
              }}
            >
              Study Session 3
            </div>
            <textarea
              style={boxStyle}
              value={third}
              onChange={(e) => setthird(e.target.value)} // Update state on typing
              placeholder="Type goals for your 3rd 25 min study session..."
            />

            {/* Session 4 */}
            <div
              style={{
                height: '30px',
                fontWeight: 'bold',
                textAlign: 'center',
              }}
            >
              Study Session 4
            </div>
            <textarea
              style={boxStyle}
              value={fourth}
              onChange={(e) => setfourth(e.target.value)} // Update state on typing
              placeholder="Type goals for your last 25 min study session..."
            />
          </div>
        </div>
      )}

      {/* Floating Options that appear when clicking the icon */}
      {showFloatingOptions && (
        <div
          style={{
            position: 'fixed',
            //left: `${floatingIconPosition.x}px`,
            left: `${Math.max(
              floatingIconPosition.x,
              window.innerWidth / 2 + 400
            )}px`, // Ensure it stays in the right half
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
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '4px',
                objectFit: 'scale-down',
              }}
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
                  if (searchimg == true) {
                    setsearch(false);
                  } else {
                    setsearch(true);
                  }
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
                onClick={() => openImage(img1)}
              >
                <img
                  src={img1}
                  alt="Image 1"
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '4px',
                    objectFit: 'scale-down',
                  }}
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
                onClick={() => openImage(img2)}
              >
                <img
                  src={img2}
                  alt="Image 2"
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '4px',
                    objectFit: 'scale-down',
                  }}
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
                onClick={() => openImage(img3)}
              >
                <img
                  src={img3}
                  alt="Image 3"
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '4px',
                    objectFit: 'scale-down',
                  }}
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
                onClick={() => openImage(img4)}
              >
                <img
                  src={img4}
                  alt="Image 4"
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '4px',
                    objectFit: 'scale-down',
                  }}
                />
              </button>
            </div>
          )}

          {/* <button onClick={ handleMCQButtonClick}>
            <img
              src="/mcq_image.png"
              alt="MCQ Button"
              style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'scale-down' }}
            />
          </button> */}

          <button
            onClick={handlePomodoroClick}
            style={{ marginBottom: '10px' }}
          >
            <img
              src="/pomodoro_mode_image.png"
              alt="Pomodoro Button"
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '4px',
                objectFit: 'scale-down',
              }}
            />
          </button>
        </div>
      )}
    </div>
  );
};

export default CanvasEditor;