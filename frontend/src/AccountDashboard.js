import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NavigationBar from './NavigationBar';
import styles from './AccountDashboard.module.css';
import UpdatePopup from './update';

function AccountDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  //const user = location.state?.user;
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  const [user, setUser] = useState(() => {
    // Try to get user from location first, otherwise from localStorage
    return location.state?.user || JSON.parse(localStorage.getItem('user'));
  });

  useEffect(() => {
    if (!user) {
      navigate('/LogIn');
    } else {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [user, navigate]);

  console.log('user is:', user);

  if (!user) return null;

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    console.log('here option:', option);
  };

  const handleDelete = async (option) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this note?'
    );
    if (!confirmed) return; // If user cancels, just stop.

    try {
      const response = await fetch(
        'https://inkquizly.onrender.com/deleteNote',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ note: option, user: user.id }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    if (selectedOption !== null) {
      // Only navigate when selectedOption has been updated
      console.log('Navigating with selected note:', selectedOption);
      navigate('/CanvasEditor', {
        state: { noteID: selectedOption, key: user.id },
      });
    }
  }, [selectedOption, navigate]); // Dependency on selectedOption

  const [noteNames, setNoteNames] = useState([]);
  const [conf, setConf] = useState([]);

  useEffect(() => {
    // Define the function to fetch data
    const fetchNoteNames = async () => {
      try {
        const response = await fetch('https://inkquizly.onrender.com/getNote', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user: user.id }), // Pass UID or necessary data
          //body: JSON.stringify({ user: "5f3fbb27-e377-4344-a805-b9ebd0a93311" }), //IMPORTANT
        });

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        setNoteNames(data.note_names); // Assuming the server returns a list of note names
        setConf(data.confidences);
        setCloud('☁️✅');
      } catch (error) {
        console.error('Error:', error);
      }
    };

    // Call the function when the component mounts
    fetchNoteNames();
  }, []); // Empty dependency array means this will run only once after the initial render

  const groupedNotes = {};

  noteNames.forEach((note, index) => {
    // Split based on ⚪️ or any similar separator
    const split = note.split('⚪️');
    const groupTitle =
      split.length > 1 && split[0] != '' ? split[0] : 'Standalone';
    const title = split.length > 1 ? split[1] : note;

    if (!groupedNotes[groupTitle]) {
      groupedNotes[groupTitle] = [];
    }

    groupedNotes[groupTitle].push({ title, index });
  });

  const handleOpen = () => {
    console.log('selected:', selectedOption);
    navigate('/CanvasEditor', {
      state: { noteID: selectedOption, key: user.id },
    });
  };

  const [noteName, setNotebookName] = useState('');
  const [folderName, setfoldername] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [showPopup1, setShowPopup1] = useState(false);
  const [currfolder, setfolder] = useState('');

  const handleFullNew = () => {
    setShowPopup1(true); // Show the popup to ask for the notebook name
  };

  const handleNew = (folder) => {
    setfolder(folder);
    setShowPopup(true); // Show the popup to ask for the notebook name
  };

  const handleNameChange = (e) => {
    setNotebookName(e.target.value); // Update the notebook name
  };

  const handleFolderChange = (e) => {
    setfoldername(e.target.value); // Update the notebook name
  };

  const handleCreate = (nameofnote) => {
    if (nameofnote.trim() !== '') {
      // Navigate to CanvasEditor with the notebook name passed via state
      console.log('note:', nameofnote);
      saveCanvases(nameofnote);
      console.log("I'm HERE FORSHO");
      //navigate("/CanvasEditor", { state: { noteID: noteName, isNew: true} });
      setShowPopup(false); // Close the popup
    } else {
      alert('Please enter a notebook name.');
    }
  };

  const saveCanvases = (nameofnote) => {
    // Prepare minimal data for saving

    //const blankCanvasJSON = "{\"version\":\"6.6.2\",\"objects\":[]}";
    const blankCanvasObject = {
      version: '6.6.2',
      objects: [],
    };
    const indices = Array.from({ length: 10 }).map((canvas, index) => index);
    const datas = Array.from({ length: 10 }).map(() =>
      JSON.stringify(blankCanvasObject)
    );
    // const datas = Array.from({ length: 10 }).map((canvas) =>
    //     JSON.stringify(blankCanvasJSON)
    //       .replace(/'/g, '`')
    //       .replace(/[\x00-\x1F\x7F]/g, '')
    //       .replace(/\\"(.*?)\\"/g, (_, inner) => `\`${inner}\``)
    //       .replace(/\\n/g, '\\\\n')
    //   );
    console.log('datasout:', datas);
    console.log('note:', nameofnote);
    console.log('index:', indices);
    console.log('user:', user.id);

    const handleSubmit = () => {
      console.log('here saving user is:', user.id);
      fetch('https://inkquizly.onrender.com/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note: nameofnote,
          index: indices,
          dat: datas,
          user: user.id,
          //user: "5f3fbb27-e377-4344-a805-b9ebd0a93311",
          conf: 'NA',
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          navigate('/CanvasEditor', {
            state: { noteID: nameofnote, key: user.id },
          });
        })
        .catch((error) => {
          console.error('Error:', error);
          setResponse('An Error occurred while submitting the form.');
        });
    };

    handleSubmit(); // Submit the data to the backend
  };

  const handleLogout = () => {
    localStorage.removeItem('user'); // Remove user data from local storage
    navigate('/LogIn'); // Redirect to login page
  };

  // const handleNew = (e) => {

  //     navigate("/CanvasEditor");
  // };
  const splitText = (text) => {
    return text.split('').map((letter, index) => (
      <span
        key={index}
        style={{
          opacity: 0, // <-- Start invisible!
          animation: `letterAnimation 0.5s ease forwards`,
          animationDelay: `${index * 0.1}s`,
          animationFillMode: 'forwards', // <-- Important to keep final animation state
        }}
      >
        {letter}
      </span>
    ));
  };

  // Function to animate each number separately
  const [time, setTime] = useState(new Date());
  const [cloud, setCloud] = useState('☁️ 🔄 Syncing');

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 60000); // Update every minute
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const formattedTime = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const splitTime = formattedTime.split('  ');

  const [currentDate, setCurrentDate] = useState('');

  // Function to format the date
  const getFormattedDate = () => {
    const today = new Date();
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return today.toLocaleDateString('en-US', options);
  };

  // Effect hook to set the date when the component mounts
  useEffect(() => {
    setCurrentDate(getFormattedDate());
  }, []); // Empty dependency array ensures it runs only once on mount

  const [expandedStackIndex, setExpandedStackIndex] = useState(null);

  function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360; // Keep it in 0–359 range
    return `hsl(${hue}, 70%, 80%)`; // Light pastel color
  }

  return (
    <div className={styles.dashboardWrapper}>
      {/* <NavigationBar /> */}
      <UpdatePopup />
      <div
        style={{
          position: 'fixed', // Fix it at the top
          top: '0', // Position it at the top
          left: '50%', // Horizontally center it
          transform: 'translateX(-50%)', // Adjust for true center
          zIndex: 999, // Ensure it stays on top of other content
          display: 'flex', // Flex to align content
          alignItems: 'center', // Center logo vertically within the container
          justifyContent: 'center', // Ensure it's centered in the parent
          padding: '10px', // Optional padding for the logo's container
        }}
      >
        <img
          src="iq.png"
          alt="Logo"
          style={{
            height: '100px', // Adjust size of the logo
            width: 'auto', // Maintain aspect ratio
          }}
        />
      </div>

      <div
        style={{
          position: 'fixed', // Position it fixed to the screen
          top: '5',
          left: '5',
          color: 'white',
          fontSize: '18px',
          backgroundColor: 'rgba(67, 73, 93, 0.99)', // Optional: for better visibility
          borderRadius: '30px', // Optional: rounded corners
          zIndex: 999,
          display: 'flex', // <--- Add flex
          alignItems: 'center', // <--- Center vertically
          gap: '10px', // <--- Add some space between
          justifyContent: 'space-between', // Space out items to the ends
          width: '80%', // Stretch across the full width
          padding: '30px', // Add padding around the content
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            style={{
              fontFamily: 'SF Pro Display,sans-serif', // Apply the futuristic font
            }}
          >
            {splitText('Welcome, ' + (user?.name || 'Loading...'))}
          </div>
          <div></div>
          {/* Log Out Button */}
          <div className={styles.logoutWrapper}>
            <button onClick={handleLogout} className={styles.logoutButton}>
              Log Out
            </button>
          </div>
        </div>
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            color: 'white',
            padding: '10px 20px',
            fontSize: '24px',
            borderRadius: '10px',
            fontFamily: 'monospace',
            display: 'inline-flex',
            gap: '10px',
            flexDirection: 'column',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            marginTop: '10px',
            alignItems: 'center', // Centers items horizontally
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(36, 240, 0, 0.5)',
              color: 'white',
              padding: '5px',
              fontSize: '15px',
              borderRadius: '10px',
              fontFamily: 'monospace',
              display: 'inline-flex',
              flexDirection: 'column',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.71)',
              alignItems: 'center', // Centers items horizontally
            }}
          >
            {cloud}
          </div>
          {splitTime.map((digit, index) => (
            <span
              key={index}
              style={{
                display: 'inline-block',
                animation: `slideAnimation 1s ease forwards ${index * 0.2}s`,
              }}
            >
              {digit}
            </span>
          ))}

          <div>{currentDate}</div>
        </div>
        <style>
          {`
          @keyframes letterAnimation {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
        </style>
      </div>

      {/* Popup for naming new note */}
      {showPopup1 && (
        <div className={styles.popupBackground}>
          <div className={styles.popupContent}>
            <h3>Name your new note</h3>
            <input
              type="text"
              value={noteName}
              onChange={handleNameChange}
              placeholder="Enter note name"
              style={{
                width: '80%',
                padding: '12px 16px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                backgroundColor: '#f9f9f9',
                color: '#333',
                outline: 'none',
                transition: 'all 0.3s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#4A90E2'; // Change border color on focus
                e.target.style.backgroundColor = '#fff'; // Change background on focus
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#ccc'; // Reset border color when focus is lost
                e.target.style.backgroundColor = '#f9f9f9'; // Reset background color
              }}
            />
            <h3>Enter folder name (Optional)</h3>
            <input
              type="text"
              value={folderName}
              onChange={handleFolderChange}
              placeholder="Enter note name"
              style={{
                width: '80%',
                padding: '12px 16px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                backgroundColor: '#f9f9f9',
                color: '#333',
                outline: 'none',
                transition: 'all 0.3s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#4A90E2'; // Change border color on focus
                e.target.style.backgroundColor = '#fff'; // Change background on focus
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#ccc'; // Reset border color when focus is lost
                e.target.style.backgroundColor = '#f9f9f9'; // Reset background color
              }}
            />
            <div className={styles.popupButtons}>
              <button
                className="popupButton popupCreateButton"
                onClick={() => {
                  handleCreate(folderName + '⚪️' + noteName);
                  setShowPopup1(false);
                }} // Wrap the function call inside an anonymous function
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#4f46e5', // Indigo
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease, transform 0.2s ease',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Soft shadow
                }}
              >
                Create
              </button>
              <button
                className="popupButton popupCancelButton"
                onClick={() => setShowPopup1(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#e0e0e0',
                  color: '#333',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease, transform 0.2s ease',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Soft shadow
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup for naming new note inside folder */}
      {showPopup && (
        <div className={styles.popupBackground}>
          <div className={styles.popupContent}>
            <h3>Name your new note inside {currfolder}</h3>
            <input
              type="text"
              value={noteName}
              onChange={handleNameChange}
              placeholder="Enter note name"
              style={{
                width: '80%',
                padding: '12px 16px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                backgroundColor: '#f9f9f9',
                color: '#333',
                outline: 'none',
                transition: 'all 0.3s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#4A90E2'; // Change border color on focus
                e.target.style.backgroundColor = '#fff'; // Change background on focus
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#ccc'; // Reset border color when focus is lost
                e.target.style.backgroundColor = '#f9f9f9'; // Reset background color
              }}
            />

            <div className={styles.popupButtons}>
              <button
                className="popupButton popupCreateButton"
                onClick={() => {
                  handleCreate(currfolder + '⚪️' + noteName);
                  setShowPopup(false);
                }} // Wrap the function call inside an anonymous function
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#4f46e5', // Indigo
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease, transform 0.2s ease',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Soft shadow
                }}
              >
                Create
              </button>
              <button
                className="popupButton popupCancelButton"
                onClick={() => setShowPopup(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#e0e0e0',
                  color: '#333',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease, transform 0.2s ease',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Soft shadow
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.notesGrid}>
        {/* New Note Button */}
        <div className={styles.noteCardNew} onClick={handleFullNew}>
          <div className={styles.plusSign}>+</div>
          <div className={styles.cardLabel}>New Note</div>
        </div>
        {/* Existing Notes
        {noteNames &&
          noteNames.map((note, index) => (
            <div
              key={index}
              className={styles.noteCard}
              onClick={() => {
                console.log('note=', note);
                handleOptionClick(note);
              }}
            >
              <div className={styles.noteTitle}>{note}</div>
              <div>{conf[index]}</div>
              <div>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent click from reaching the card
                    handleDelete(note);
                  }}
                  style={{
                    backgroundColor: 'white' /* Red background ,
                    color: 'red' /* White text ,
                    border: 'none' /* No border ,
                    fontSize: '16px' /* Font size ,
                    borderRadius: '5px' /* Rounded corners ,
                    cursor: 'pointer' /* Pointer cursor on hover ,
                    transition:
                      'all 0.3s ease' /* Smooth transition for hover effects ,
                    marginTop: 50,
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor =
                      '#d32f2f'; /* Darker red on hover 
                    e.target.style.color = 'white'; /* White text on hover 
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor =
                      'white'; /* Reset to original red 
                    e.target.style.color = 'red'; /* Keep text white 
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))} */}
        {/* Render stacks and standalone notes */}
        {Object.entries(groupedNotes).map(([groupTitle, notes], stackIndex) => {
          const isStandalone = groupTitle === 'Standalone';

          // Standalone notes (not part of any stack)
          if (isStandalone) {
            return notes.map(({ title, index }) => (
              <div
                key={index}
                className={styles.noteCard}
                onClick={() => handleOptionClick(noteNames[index])}
              >
                <div className={styles.noteTitle}>{title}</div>
                <div>{conf[index]}</div>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent click from reaching the card
                    handleDelete('⚪️' + title);
                  }}
                  style={{
                    backgroundColor: 'white' /* Red background */,
                    color: 'red' /* White text */,
                    border: 'none' /* No border */,
                    fontSize: '16px' /* Font size */,
                    borderRadius: '5px' /* Rounded corners */,
                    cursor: 'pointer' /* Pointer cursor on hover */,
                    transition:
                      'all 0.3s ease' /* Smooth transition for hover effects */,
                    marginTop: 50,
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor =
                      '#d32f2f'; /* Darker red on hover */
                    e.target.style.color = 'white'; /* White text on hover */
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor =
                      'white'; /* Reset to original red */
                    e.target.style.color = 'red'; /* Keep text white */
                  }}
                >
                  🗑️
                </button>
              </div>
            ));
          }

          return (
            <div key={`stack-${stackIndex}`} className={styles.stackRow}>
              {/* Folder */}
              <div
                className={styles.noteCard}
                style={{ backgroundColor: stringToColor(groupTitle) }}
                onClick={() =>
                  setExpandedStackIndex(
                    expandedStackIndex === stackIndex ? null : stackIndex
                  )
                }
              >
                <div className={styles.stackLabel}>
                  <b>📁 {groupTitle}</b>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    margin: '1rem 0',
                  }}
                >
                  <button
                    onClick={() => handleNew(groupTitle)} // Use an anonymous function to pass the groupTitle correctly
                    style={{
                      backgroundColor: 'rgba(0, 2, 0, 0)',
                      color: 'black',
                      fontSize: '13px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.3s ease',
                      width: '100%',
                      alignItems: 'center',
                    }}
                    onMouseOver={(e) => {
                      e.target.style.color = 'grey';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = 'rgba(0, 2, 0, 0)';
                      e.target.style.color = 'black';
                    }}
                  >
                    ➕ Add Note
                  </button>
                </div>
              </div>

              {/* Notes shown horizontally */}
              {expandedStackIndex === stackIndex && (
                <div className={styles.notesInStack}>
                  {notes.map(({ title, index }) => (
                    <div
                      key={index}
                      className={styles.noteCard}
                      style={{ backgroundColor: stringToColor(groupTitle) }}
                      onClick={() => handleOptionClick(noteNames[index])}
                    >
                      <div className={styles.noteTitle}>{title}</div>
                      <div>{conf[index]}</div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent click from reaching the card
                          handleDelete(groupTitle + '⚪️' + title);
                        }}
                        style={{
                          backgroundColor:
                            stringToColor(groupTitle) /* Red background */,
                          color: 'red' /* White text */,
                          border: 'none' /* No border */,
                          fontSize: '16px' /* Font size */,
                          borderRadius: '5px' /* Rounded corners */,
                          cursor: 'pointer' /* Pointer cursor on hover */,
                          transition:
                            'all 0.3s ease' /* Smooth transition for hover effects */,
                          marginTop: 50,
                        }}
                        onMouseOver={(e) => {
                          e.target.style.backgroundColor =
                            '#d32f2f'; /* Darker red on hover */
                          e.target.style.color =
                            stringToColor(groupTitle); /* White text on hover */
                        }}
                        onMouseOut={(e) => {
                          e.target.style.backgroundColor =
                            stringToColor(
                              groupTitle
                            ); /* Reset to original red */
                          e.target.style.color = 'red'; /* Keep text white */
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AccountDashboard;
