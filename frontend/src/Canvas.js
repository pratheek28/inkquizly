/* Access-Control-Allow-Origin */
/* global TimestampTrigger */

import React, { useRef, useState, useEffect } from 'react';
import * as fabric from 'fabric';
import { SketchPicker } from 'react-color';
import { useNavigate, useLocation } from 'react-router-dom';

const CanvasEditor = () => {
  const [canvases, setCanvases] = useState([]); // Single canvas
  const [brushColor, setBrushColor] = useState('#000000'); // Default to black marker
  const [activeTool, setActiveTool] = useState(''); // Track the active tool
  const [activeCanvasIndex, setActiveCanvasIndex] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [response, setResponse] = useState(null);

  // New state for floating icon options
  const [showFloatingOptions, setShowFloatingOptions] = useState(false);
  const [showPomodoroRect, setShowPomodoroRect] = useState(false); // New state for Pomodoro rectangle
  const canvasRef = useRef([]); // Ref for the canvas element
  //let confidenceLevels = []; // Make sure this is accessible in your scope
  const [confidenceLevels, setConfidenceLevels] = useState([]);
  const [showTextbox, setShowTextbox] = useState(false);
  const [diagramInput, setDiagramInput] = useState('');
  const [showGrid, setShowGrid] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(2); // 25 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [searchimg, setsearch] = useState(false);

  const [first, setfirst] = useState(''); //setting for study plan
  const [second, setsecond] = useState('');
  const [third, setthird] = useState('');
  const [fourth, setfourth] = useState('');

  const location = useLocation();
  const [isNew, setIsNew] = useState(location.state?.isNew);


  //const noteID= "note-1"
  const noteID = location.state?.noteID; // Get the notebook name from state
  const key = location.state?.key; // Get the notebook name from state
  console.log('noteID=', noteID);

  const user = '1';

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

  //setIsNew(location.state?.isNew);

  useEffect(() => {
    const newCanvases = [];

    if (true) {
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
          console.error(`Canvas element at index ${index} is not available!`);
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
        console.log('is canvas valid?! ', canvas);

        // Load JSON content first and then add your custom objects
        canvas.clear();
        canvas.loadFromJSON(JSON.parse(jsonString)).then(() => {
          console.log('Callback triggered!'); // this will definitely run after all deserialization is complete
          canvas.renderAll();

          const objects = canvas.getObjects();
          console.log('Objects loaded:', objects.length);

          canvas.isDrawingMode = true;
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.color = brushColor;
        canvas.freeDrawingBrush.width = 5;

        const handleClick = () => {
          setActiveCanvasIndex(index);
          console.log(`Canvas ${index} clicked`);
        };

        canvas.on('mouse:over', () => handleClick(index));
        canvas.on('touchstart', handleClick);


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
        });

        // Debug logging to confirm canvas rendering
        canvas.renderAll();
        console.log('Canvasref=', canvasRef.current[index]);

        // Handle canvas click event
        const handleClick = () => {
          setActiveCanvasIndex(index);
          console.log(`Canvas ${index} clicked`);
        };

        // Set up mouseover event
        canvas.on('mouse:over', handleClick);
        canvas.on('touchstart', handleClick);


        newCanvases.push(canvas);


            });
            setCanvases(newCanvases);
          })
          .catch((error) => {
            console.error('Error:', error);
            setResponse('An Error occurred while submitting the form.');
          });
      };

      handleSubmitload(); // Submit the data to the backend

      // for (let i = 0; i < numPages; i++) {
      //   const canvas = new fabric.Canvas(canvasRef.current[i], {
      //     width: A4_WIDTH,
      //     height: A4_HEIGHT,
      //     backgroundColor: null,
      //   });
      //   canvas.isDrawingMode = true;
      //   canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      //   canvas.freeDrawingBrush.color = brushColor;
      //   canvas.freeDrawingBrush.width = 5;

      //   const handleClick = () => {
      //     setActiveCanvasIndex(i);
      //     console.log(`Canvas ${i} clicked`);
      //   };

      //   canvas.on('mouse:over', () => handleClick(i));
      //   newCanvases.push(canvas);

      for (let i = 0; i < numPages; i++) { //HEREEEE
        // const canvasElement = canvasRef.current[i];

        // // Check if the canvas element is valid and exists
        // if (!canvasElement) {
        //   console.error(`Canvas element at index ${i} is not available!`);
        //   continue;
        // }

        // const canvas = new fabric.Canvas(canvasElement, {
        //   width: A4_WIDTH,
        //   height: A4_HEIGHT,
        //   backgroundColor: null, // Set background color to white
        // });

        // let jsonString =
        //   '{"version":"6.6.2","objects":[{"fontSize":24,"fontWeight":"bold","fontFamily":"Times New Roman","fontStyle":"normal","lineHeight":1.16,"text":"Thermodynamics","charSpacing":0,"textAlign":"left","styles":[],"pathStartOffset":0,"pathSide":"left","pathAlign":"baseline","underline":false,"overline":false,"linethrough":false,"textBackgroundColor":"","direction":"ltr","minWidth":20,"splitByGrapheme":false,"type":"Textbox","version":"6.6.2","originX":"left","originY":"top","left":78.9054,"top":41.6211,"width":200,"height":27.12,"fill":"rgb(0,0,0)","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeDashOffset":0,"strokeLineJoin":"miter","strokeUniform":false,"strokeMiterLimit":4,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"backgroundColor":"","fillRule":"nonzero","paintFirst":"fill","globalCompositeOperation":"source-over","skewX":0,"skewY":0},{"type":"Line","version":"6.6.2","originX":"left","originY":"top","left":69.7246,"top":74.4332,"width":189.0661,"height":0,"fill":"rgb(0,0,0)","stroke":"black","strokeWidth":2,"strokeDashArray":null,"strokeLineCap":"butt","strokeDashOffset":0,"strokeLineJoin":"miter","strokeUniform":false,"strokeMiterLimit":4,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"backgroundColor":"","fillRule":"nonzero","paintFirst":"fill","globalCompositeOperation":"source-over","skewX":0,"skewY":0,"x1":-94.53304303155736,"x2":94.53304303155736,"y1":0,"y2":0},{"rx":0,"ry":0,"type":"Rect","version":"6.6.2","originX":"left","originY":"top","left":304.7907,"top":68.4332,"width":100,"height":10,"fill":"transparent","stroke":"gray","strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeDashOffset":0,"strokeLineJoin":"miter","strokeUniform":false,"strokeMiterLimit":4,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"backgroundColor":"","fillRule":"nonzero","paintFirst":"fill","globalCompositeOperation":"source-over","skewX":0,"skewY":0},{"rx":0,"ry":0,"type":"Rect","version":"6.6.2","originX":"left","originY":"top","left":304.7907,"top":68.4332,"width":61.2433,"height":10,"fill":"rgb(23, 225, 23)","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeDashOffset":0,"strokeLineJoin":"miter","strokeUniform":false,"strokeMiterLimit":4,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"backgroundColor":"","fillRule":"nonzero","paintFirst":"fill","globalCompositeOperation":"source-over","skewX":0,"skewY":0},{"fontSize":24,"fontWeight":"bold","fontFamily":"Times New Roman","fontStyle":"normal","lineHeight":1.16,"text":"Oscillations","charSpacing":0,"textAlign":"left","styles":[],"pathStartOffset":0,"pathSide":"left","pathAlign":"baseline","underline":false,"overline":false,"linethrough":false,"textBackgroundColor":"","direction":"ltr","minWidth":20,"splitByGrapheme":false,"type":"Textbox","version":"6.6.2","originX":"left","originY":"top","left":132.5347,"top":299.7531,"width":200,"height":27.12,"fill":"rgb(0,0,0)","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeDashOffset":0,"strokeLineJoin":"miter","strokeUniform":false,"strokeMiterLimit":4,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"backgroundColor":"","fillRule":"nonzero","paintFirst":"fill","globalCompositeOperation":"source-over","skewX":0,"skewY":0},{"type":"Line","version":"6.6.2","originX":"left","originY":"top","left":120.627,"top":331.6562,"width":145.4355,"height":0,"fill":"rgb(0,0,0)","stroke":"black","strokeWidth":2,"strokeDashArray":null,"strokeLineCap":"butt","strokeDashOffset":0,"strokeLineJoin":"miter","strokeUniform":false,"strokeMiterLimit":4,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"backgroundColor":"","fillRule":"nonzero","paintFirst":"fill","globalCompositeOperation":"source-over","skewX":0,"skewY":0,"x1":-72.71772540889029,"x2":72.71772540889029,"y1":0,"y2":0},{"rx":0,"ry":0,"type":"Rect","version":"6.6.2","originX":"left","originY":"top","left":312.0625,"top":325.6562,"width":100,"height":10,"fill":"transparent","stroke":"gray","strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeDashOffset":0,"strokeLineJoin":"miter","strokeUniform":false,"strokeMiterLimit":4,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"backgroundColor":"","fillRule":"nonzero","paintFirst":"fill","globalCompositeOperation":"source-over","skewX":0,"skewY":0},{"rx":0,"ry":0,"type":"Rect","version":"6.6.2","originX":"left","originY":"top","left":312.0625,"top":325.6562,"width":22.2107,"height":10,"fill":"rgb(23, 225, 23)","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeDashOffset":0,"strokeLineJoin":"miter","strokeUniform":false,"strokeMiterLimit":4,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"backgroundColor":"","fillRule":"nonzero","paintFirst":"fill","globalCompositeOperation":"source-over","skewX":0,"skewY":0},{"fontSize":24,"fontWeight":"bold","fontFamily":"Times New Roman","fontStyle":"normal","lineHeight":1.16,"text":"Waves","charSpacing":0,"textAlign":"left","styles":[],"pathStartOffset":0,"pathSide":"left","pathAlign":"baseline","underline":false,"overline":false,"linethrough":false,"textBackgroundColor":"","direction":"ltr","minWidth":20,"splitByGrapheme":false,"type":"Textbox","version":"6.6.2","originX":"left","originY":"top","left":96.1758,"top":465.3776,"width":200,"height":27.12,"fill":"rgb(0,0,0)","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeDashOffset":0,"strokeLineJoin":"miter","strokeUniform":false,"strokeMiterLimit":4,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"backgroundColor":"","fillRule":"nonzero","paintFirst":"fill","globalCompositeOperation":"source-over","skewX":0,"skewY":0},{"type":"Line","version":"6.6.2","originX":"left","originY":"top","left":88.813,"top":498.1896,"width":95.442,"height":0,"fill":"rgb(0,0,0)","stroke":"black","strokeWidth":2,"strokeDashArray":null,"strokeLineCap":"butt","strokeDashOffset":0,"strokeLineJoin":"miter","strokeUniform":false,"strokeMiterLimit":4,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"backgroundColor":"","fillRule":"nonzero","paintFirst":"fill","globalCompositeOperation":"source-over","skewX":0,"skewY":0,"x1":-47.72100729958425,"x2":47.72100729958425,"y1":0,"y2":0},{"rx":0,"ry":0,"type":"Rect","version":"6.6.2","originX":"left","originY":"top","left":230.255,"top":492.1896,"width":100,"height":10,"fill":"transparent","stroke":"gray","strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeDashOffset":0,"strokeLineJoin":"miter","strokeUniform":false,"strokeMiterLimit":4,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"backgroundColor":"","fillRule":"nonzero","paintFirst":"fill","globalCompositeOperation":"source-over","skewX":0,"skewY":0},{"rx":0,"ry":0,"type":"Rect","version":"6.6.2","originX":"left","originY":"top","left":230.255,"top":492.1896,"width":100,"height":10,"fill":"rgb(23, 225, 23)","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeDashOffset":0,"strokeLineJoin":"miter","strokeUniform":false,"strokeMiterLimit":4,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"backgroundColor":"","fillRule":"nonzero","paintFirst":"fill","globalCompositeOperation":"source-over","skewX":0,"skewY":0}]}';

        // console.log('is canvas valid?! ', canvas);

        // // Load JSON content first and then add your custom objects
        // canvas.clear();
        // canvas.loadFromJSON(JSON.parse(jsonString)).then(() => {
        //   console.log('Callback triggered!'); // this will definitely run after all deserialization is complete
        //   canvas.renderAll();

        //   const objects = canvas.getObjects();
        //   console.log('Objects loaded:', objects.length);

        //   objects.forEach((obj) => {
        //     console.log('object:', obj);
        //     if (obj.fill?.replace(/\s/g, '') === 'rgb(23,225,23)') {
        //       console.log('object found');
        //       obj.set({
        //         hasBorders: false,
        //         hasControls: true,
        //         lockScalingY: true,
        //         lockMovementY: true,
        //         lockMovementX: true,
        //         lockRotation: true,
        //         originX: 'left',
        //         originY: 'top',
        //       });
        //       obj.setControlsVisibility({
        //         mt: false,
        //         mb: false,
        //         ml: false,
        //         mr: true,
        //         tl: false,
        //         tr: false,
        //         bl: false,
        //         br: false,
        //         mtr: false,
        //       });
        //       let maxleft = obj.left;

        //       const topicindex = topicsindexes.current;
        //       topicsindexes.current++; // persists across re-renders

        //       const scaledWidth = obj.width * obj.scaleX;
        //       const newWidth = Math.min(100, Math.max(1, scaledWidth));

        //       const newConfidence = newWidth / 100;

        //       setConfidenceLevels((prev) => {
        //         const updated = [...prev];
        //         updated[topicindex] = newConfidence;
        //         return updated;
        //       });

        //       obj.on('scaling', function () {
        //         const scaledWidth = obj.width * obj.scaleX;
        //         const newWidth = Math.min(100, Math.max(1, scaledWidth));

        //         obj.set({
        //           scaleX: 1,
        //           width: newWidth,
        //           left: maxleft, // lock left position
        //         });

        //         const newConfidence = newWidth / 100;

        //         setConfidenceLevels((prev) => {
        //           const updated = [...prev];
        //           updated[topicindex] = newConfidence;
        //           return updated;
        //         });

        //         // // Store confidence for the current topic
        //         // const existing = confidenceLevels.find(entry => entry.topic === topic);
        //         // if (existing) {
        //         //   existing.confidence = newConfidence;
        //         // } else {
        //         //   confidenceLevels.push({ topic, confidence: newConfidence });
        //         // }

        //         canvas.requestRenderAll();
        //       });
        //     }
        //     if (
        //       obj.fill?.replace(/\s/g, '') === 'transparent' &&
        //       obj.stroke === 'gray'
        //     ) {
        //       obj.set({
        //         selectable: false,
        //         evented: false,
        //       });
        //       canvas.requestRenderAll();
        //     }
        //   });

        //   canvas.renderAll();

        //   console.log('Canvas loaded yes!');
        // });

        // // Debug logging to confirm canvas rendering
        // canvas.renderAll();
        // console.log('Canvasref=', canvasRef.current[i]);

        // // Handle canvas click event
        // const handleClick = () => {
        //   setActiveCanvasIndex(i);
        //   console.log(`Canvas ${i} clicked`);
        // };

        // // Set up mouseover event
        // canvas.on('mouse:over', handleClick);

        // newCanvases.push(canvas);
      }

      // const handleSubmit = () => {
      //   console.log("here");
      //   fetch('http://127.0.0.1:5000/load', {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json"
      //     },
      //     body: JSON.stringify({ unique:uid})
      //   })
      //   .then(response => response.json())
      //   .then(data => {
      //     setResponse(data.definition);
      //     console.log("log is",data.definition);
      //     console.log("response is",response);

      //     for (let i = 0; i < numPages; i++) {
      //       const canvas = new fabric.Canvas(canvasRef.current[i], {
      //         width: A4_WIDTH,
      //         height: A4_HEIGHT,
      //         backgroundColor: 'white',  // Set background color to white
      //       });

      //       //var canvas = new fabric.Canvas();

      //       let jsonString='{"version":"6.6.2","objects":[{"type":"Path","version":"6.6.2","originX":"left","originY":"top","left":248.201,"top":168.1871,"width":295.4208,"height":75.445,"fill":null,"stroke":"#000000","strokeWidth":5,"strokeDashArray":null,"strokeLineCap":"round","strokeDashOffset":0,"strokeLineJoin":"round","strokeUniform":false,"strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"backgroundColor":"","fillRule":"nonzero","paintFirst":"fill","globalCompositeOperation":"source-over","skewX":0,"skewY":0,"path":[["M",250.7009770182928,246.1320860043442],["Q",250.7009770182928,246.1270860043442,250.7009770182928,245.67262834676455],["Q",250.7009770182928,245.2181706891849,250.7009770182928,242.0369670861274],["Q",250.7009770182928,238.85576348306986,250.7009770182928,232.49335627695478],["Q",250.7009770182928,226.13094907083973,250.7009770182928,217.9507112344061],["Q",250.7009770182928,209.77047339797247,250.7009770182928,200.22686258879986],["Q",250.7009770182928,190.68325177962726,250.7009770182928,184.3208445735122],["Q",250.7009770182928,177.95843736739712,250.7009770182928,175.6861490794989],["Q",250.7009770182928,173.41386079160068,251.15546280209833,172.0504878188617],["Q",251.60994858590388,170.68711484612277,252.9734059373206,170.68711484612277],["Q",254.3368632887373,170.68711484612277,257.0637779915707,170.68711484612277],["Q",259.7906926944041,170.68711484612277,263.8810647486541,172.95940313402102],["Q",267.97143680290424,175.23169142191927,273.425266208571,180.68518331287504],["Q",278.87909561423777,186.1386752038308,282.9694676684878,192.0466247523662],["Q",287.05983972273793,197.9545743009016,290.2412402093769,203.86252384943703],["Q",293.42264069601583,209.77047339797247,296.1495553988492,214.3150499737689],["Q",298.87647010168257,218.85962654956538,300.2399274530993,221.13191483746363],["Q",301.603384804516,223.40420312536185,302.5123563721271,224.31311844052115],["Q",303.4213279397382,225.22203375568046,304.33029950734937,225.6764914132601],["Q",305.2392710749605,226.13094907083973,307.5116999939884,225.6764914132601],["Q",309.78412891301616,225.22203375568046,314.3289867510718,221.58637249504326],["Q",318.87384458912743,217.95071123440607,323.87318821098864,212.49721934345033],["Q",328.87253183284986,207.04372745249458,332.96290388709997,202.49915087669808],["Q",337.05327594135,197.9545743009016,340.2346764279889,194.31891304026442],["Q",343.41607691462787,190.68325177962726,344.7795342660446,188.86542114930867],["Q",346.1429916174613,187.0475905189901,347.0519631850724,187.0475905189901],["Q",347.96093475268356,187.0475905189901,348.41542053648914,187.95650583414937],["Q",348.86990632029466,188.86542114930867,350.23336367171134,191.59216709478656],["Q",351.59682102312803,194.31891304026445,352.9602783745447,197.9545743009016],["Q",354.3237357259614,201.59023556153878,357.0506504287948,206.5892697949149],["Q",359.7775651316282,211.58830402829102,363.8679371858783,216.58733826166716],["Q",367.95830924012836,221.5863724950433,376.1390533486285,226.13094907083973],["Q",384.31979745712863,230.6755256466362,399.77231410651785,233.4022715921141],["Q",415.2248307559071,236.12901753759198,480.67078362390833,227.039864385999],["L",546.1217364919096,217.94571123440608]]},{"fontSize":24,"fontWeight":"bold","fontFamily":"Times New Roman","fontStyle":"normal","lineHeight":1.16,"text":"Hellode","charSpacing":0,"textAlign":"left","styles":[],"pathStartOffset":0,"pathSide":"left","pathAlign":"baseline","underline":false,"overline":false,"linethrough":false,"textBackgroundColor":"","direction":"ltr","minWidth":20,"splitByGrapheme":false,"type":"Textbox","version":"6.6.2","originX":"left","originY":"top","left":166.1666,"top":336.1097,"width":200,"height":27.12,"fill":"rgb(0,0,0)","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeDashOffset":0,"strokeLineJoin":"miter","strokeUniform":false,"strokeMiterLimit":4,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"backgroundColor":"","fillRule":"nonzero","paintFirst":"fill","globalCompositeOperation":"source-over","skewX":0,"skewY":0},{"type":"Line","version":"6.6.2","originX":"left","originY":"top","left":150.6231,"top":372.5574,"width":119.0753,"height":0,"fill":"rgb(0,0,0)","stroke":"black","strokeWidth":2,"strokeDashArray":null,"strokeLineCap":"butt","strokeDashOffset":0,"strokeLineJoin":"miter","strokeUniform":false,"strokeMiterLimit":4,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"backgroundColor":"","fillRule":"nonzero","paintFirst":"fill","globalCompositeOperation":"source-over","skewX":0,"skewY":0,"x1":-59.53763767852891,"x2":59.53763767852891,"y1":0,"y2":0},{"rx":0,"ry":0,"type":"Rect","version":"6.6.2","originX":"left","originY":"top","left":315.6984,"top":366.5574,"width":50,"height":10,"fill":"green","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeDashOffset":0,"strokeLineJoin":"miter","strokeUniform":false,"strokeMiterLimit":4,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"backgroundColor":"","fillRule":"nonzero","paintFirst":"fill","globalCompositeOperation":"source-over","skewX":0,"skewY":0},{"fontSize":12,"fontWeight":"normal","fontFamily":"Times New Roman","fontStyle":"normal","lineHeight":1.16,"text":"50%","charSpacing":0,"textAlign":"left","styles":[],"pathStartOffset":0,"pathSide":"left","pathAlign":"baseline","underline":false,"overline":false,"linethrough":false,"textBackgroundColor":"","direction":"ltr","type":"Text","version":"6.6.2","originX":"left","originY":"center","left":375.6984,"top":371.5574,"width":21.9961,"height":13.56,"fill":"rgb(0,0,0)","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeDashOffset":0,"strokeLineJoin":"miter","strokeUniform":false,"strokeMiterLimit":4,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"backgroundColor":"","fillRule":"nonzero","paintFirst":"fill","globalCompositeOperation":"source-over","skewX":0,"skewY":0},{"cropX":0,"cropY":0,"type":"Image","version":"6.6.2","originX":"left","originY":"top","left":280.6984,"top":356.5574,"width":975,"height":971,"fill":"rgb(0,0,0)","stroke":null,"strokeWidth":0,"strokeDashArray":null,"strokeLineCap":"butt","strokeDashOffset":0,"strokeLineJoin":"miter","strokeUniform":false,"strokeMiterLimit":4,"scaleX":0.0308,"scaleY":0.0308,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"backgroundColor":"","fillRule":"nonzero","paintFirst":"fill","globalCompositeOperation":"source-over","skewX":0,"skewY":0,"src":"http://localhost:3000/inkai.png","crossOrigin":null,"filters":[]}]}'

      //       canvas.loadFromJSON(JSON.parse(jsonString), () => {
      //         canvas.renderAll();
      //         console.log("Canvas loaded!");
      //       });

      //       // Canvas data as a string
      //       //let canvas_data = '{"objects":[{"type":"rect","left":50,"top":50,"width":20,"height":20,"fill":"green"}],"background":"rgba(0, 0, 0, 0)"}';

      //       // Parse the string into a JavaScript object
      //       //const canvasDataObject = JSON.parse(canvas_data);

      //       // Load the canvas data and render the objects
      //       // canvas.loadFromJSON(canvasDataObject, () => {
      //       //   canvas.renderAll(); // Ensure the canvas is redrawn
      //       // });

      //       // Handle canvas click event
      //       const handleClick = () => {
      //         setActiveCanvasIndex(i);
      //         console.log(`Canvas ${i} clicked`);
      //       };

      //       // Set up mouseover event
      //       canvas.on('mouse:over', handleClick);

      //       newCanvases.push(canvas);
      //     }

      //   })
      //   .catch(error => {
      //     console.error("Error:", error);
      //     setResponse("An Error occurred while submitting the form.");
      //   });
      // };

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
        canvas.dispose();
        canvas.off('mouse:over');
        canvas.off('touchstart');
      });
    };
  }, []);

  const [notetitle, setnotetitle] = useState('Notebook 1');

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
    const datas = canvases.map((canvas) =>
      JSON.stringify(canvas.toJSON())
        // .replace(/'/g, '`')
        // .replace(/[\x00-\x1F\x7F]/g, '')
        // .replace(/\\"(.*?)\\"/g, (_, inner) => `\`${inner}\``)
        // .replace(/\\n/g, '\\\\n')
    );

    console.log("HELLOOOOdatasin:",datas);
    console.log("userkey:",key);

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
    console.log("noteitle:",notetitle);

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
          conf:notetitle,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          setResponse(data.definition);
          console.log('log is', data.definition);
          console.log('response is', response);
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
  const [img1, setimg1] = useState('');
  const [img2, setimg2] = useState('');
  const [img3, setimg3] = useState('');
  const [img4, setimg4] = useState('');
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
    if(showPomodoroRect===true){
      setShowPomodoroRect(false);
    }
    else{
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
          // Special Highlighter tool handler
          canvas.isDrawingMode = false;
          let startX, startY;
          let highlightRect = null;
          console.log('prevstartx=', startX);

            // Save the previous state of all objects (for later restoration)
  const previousStates = canvas.getObjects().map((obj) => ({
    obj:obj,
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
      if (previousState && previousState.obj) { // Ensure the object exists
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
            console.log("touchstart triggered");
            registration.showNotification('touchstart!', {
              body: 'Your 25 minute study session is over',
              icon: './logo192.png',
              showTrigger: new TimestampTrigger(timestamp), // Schedule in the future
            });
            onMouseDownsub(e);
          });
          canvas.on('pointermove', (e) => {
            console.log("touchmove triggered");
            registration.showNotification('touchmove!', {
              body: 'Your 25 minute study session is over',
              icon: './logo192.png',
              showTrigger: new TimestampTrigger(timestamp), // Schedule in the future
            });
            onMouseMovesub(e);
          });
          canvas.on('pointerup', (e) => {
            console.log("touchend triggered");
            registration.showNotification('touchend!', {
              body: 'Your 25 minute study session is over',
              icon: './logo192.png',
              showTrigger: new TimestampTrigger(timestamp), // Schedule in the future
            });
            onMouseUpsub(e);
          });

        } else if (activeTool === 'aihl') {
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
    const canvas = canvases[activeCanvasIndex];
    if (!canvas || !rect) return;

    let topic = '';

    // Highlight bolding
    const objectsInRegion = canvas.getObjects().filter((obj) => {
      const bounds = obj.getBoundingRect();
      return (
        bounds.left + bounds.width > rect.left &&
        bounds.top + bounds.height > rect.top &&
        bounds.left < rect.left + rect.width &&
        bounds.top < rect.top + rect.height
      );
    });

    const topicindex = topicsindexes.current;
    topicsindexes.current++; // persists across re-renders

    objectsInRegion.forEach((obj) => {
      if (obj instanceof fabric.Text || obj instanceof fabric.Textbox) {
        obj.set('fontWeight', 'bold');
        obj.setCoords(); // Force update of bounding box after setting font weight
        topic += obj.text; // Collect text from text objects
        // topicindex=topicsindexes;
        // topicsindexes++;
      } else {
        obj.set('strokeWidth', (obj.strokeWidth || 1) * 1.5);
      }
    });

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
              selectable: false,
            });
            canvas.add(summ);
            canvas.renderAll();
            underline.set({ stroke: 'rgb(40, 2, 143)' });

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


  const goHome = () => {
    setIsLoading(true); // Start the loading spinner
    saveCanvases();
  
    // Simulate a delay for the loading spinner (e.g., 3 seconds)
    setTimeout(() => {
      navigate('/AccountDashboard'); // Navigate after the delay
      setIsLoading(false);
    }, 3000); // 3000ms = 3 seconds
  };


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
    left: '20px',
    backgroundColor: 'rgba(0, 16, 120, 0.9)', // dark gray with transparency
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center', // <--- CENTER everything horizontally
    gap: '10px', // Space between items
    minWidth: '200px',
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
    <strong><h2>v1:{noteID}</h2></strong>
  </div>

  <div style={{ fontSize: '14px' }}>
    <strong>{notetitle}</strong>
  </div>
</div>


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
          <button
            onClick={openColorPallet}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              transform:
                activeTool === 'colorpallet' ? 'scale(1.8)' : 'scale(1)',
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
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '4px',
                objectFit: 'cover',
              }}
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
          //left: `${floatingIconPosition.x}px`,
          left: `${Math.max(
            floatingIconPosition.x,
            window.innerWidth / 2 - 430
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
        onTouchStart={handleIconTouchStart}  // Add touch start listener for tablets
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
            pointerEvents: 'none',  // Prevent the image from interfering with the drag
          }}
        />
      </div>

      {/* Fixed-position Pomodoro Rectangle with Timer and 6 inner rectangles */}
      {showPomodoroRect && (
        <div
          style={{
            position: 'fixed',
            left: '10px',
            top: '210px',
            width: '270px',
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
              window.innerWidth / 2 - 400
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
