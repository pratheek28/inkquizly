import { useState } from 'react';
import styles from './SignUp.module.css';
import { useNavigate } from 'react-router-dom';
import NavigationBar from './NavigationBar';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

function SignUp() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [response, setResponse] = useState('');

  const handleVarChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    fetch('https://inkquizly.onrender.com/getSignUpDetails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((data) => {
        setResponse(data.message);
      })
      .catch((error) => {
        console.error('Error:', error);
        setResponse('An error occurred. Please try again later!');
      })
      .finally(() => {
        const baseUrl =
          'https://script.google.com/macros/s/AKfycbwCI2de5lhYdI-5QEeVcQHlHaypqkQgrLmdTLw8U6JPcvtwZRHGVts2Vm4QvPSn5bP7/exec';
        const params = new URLSearchParams({
          action: 'addUser',
          name: formData.firstName + ' ' + formData.lastName,
          email: formData.email,
        });

        try {
          const response = fetch(`${baseUrl}?${params.toString()}`);
          const result = response.text();
          console.log('Server response:', result);
        } catch (error) {
          console.log('Error:', error);
        }
                        fetch('https://inkquizly.onrender.com/getLoginDetails', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
                })
                  .then((response) => response.json())
                  .then((data) => {
                    //setResponse(data.message);
                    if (data.message.includes('Success:')) {
                      navigate('/AccountDashboard', {
                        state: { user: data.user },
                      });
                    }
                  })
                  .catch((error) => {
                    console.error('Error:', error);
                    setResponse(
                      'An Error occurred. Please try again in a few mins.'
                    );
                  })
                  .finally(() => {
                    setLoading(false);
                  });
      });
  };

  return (
    <div>
      <NavigationBar />
      <form onSubmit={handleSubmit} className={styles.form_container}>
        <h1>Sign Up!</h1>

        <div className="firstName">
          <input
            type="text"
            id="firstName"
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleVarChange}
          />
        </div>

        <div className="lastName">
          <input
            type="text"
            id="lastName"
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleVarChange}
          />
        </div>

        <div className="email">
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleVarChange}
          />
        </div>

        <div className="password">
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleVarChange}
          />
        </div>

        <div className="password">
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleVarChange}
          />
        </div>

        <div className="submit" style={{ marginBottom: '10px' }}>
          <button type="submit" disabled={loading}>
            {loading
              ? 'Incredible things take time, please wait...'
              : 'Create Account'}
          </button>
          {/* <button type="submit">Create Account</button> */}
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            const decoded = jwtDecode(credentialResponse.credential);
            console.log(decoded); // contains name, email, etc.

            setLoading(true);
            fetch('https://inkquizly.onrender.com/getSignUpDetails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                firstName: decoded.given_name,
                lastName: decoded.family_name,
                email: decoded.email,
                password: 'GoogleAuth',
                confirmPassword: 'GoogleAuth',
              }),
            })
              .then((response) => response.json())
              .then((data) => {
                setResponse(data.message);
              })
              .catch((error) => {
                console.error('Error:', error);
                setResponse('An error occurred. Please try again later!');
              })
              .finally(() => {
                const baseUrl =
                  'https://script.google.com/macros/s/AKfycbwCI2de5lhYdI-5QEeVcQHlHaypqkQgrLmdTLw8U6JPcvtwZRHGVts2Vm4QvPSn5bP7/exec';
                const params = new URLSearchParams({
                  action: 'addUser',
                  name:  decoded.given_name + ' ' + decoded.family_name+ "(GAuth)",
                  email: decoded.email,
                });

                try {
                  const response = fetch(`${baseUrl}?${params.toString()}`);
                  // const result = response.text();
                  // console.log("Server response:", result);
                } catch (error) {
                  console.log('Error:', error);
                }
                fetch('https://inkquizly.onrender.com/getLoginDetails', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    firstName: decoded.given_name,
                    lastName: decoded.family_name,
                    email: decoded.email,
                    password: 'GoogleAuth',
                    confirmPassword: 'GoogleAuth',
                  }),
                })
                  .then((response) => response.json())
                  .then((data) => {
                    //setResponse(data.message);
                    if (data.message.includes('Success:')) {
                      navigate('/AccountDashboard', {
                        state: { user: data.user },
                      });
                    }
                  })
                  .catch((error) => {
                    console.error('Error:', error);
                    setResponse(
                      'An Error occurred. Please try again in a few mins.'
                    );
                  })
                  .finally(() => {
                    setLoading(false);
                  });
              });
          }}
          onError={() => {
            console.log('Login Failed');
          }}
        />
        </div>
        {response && (
          <p
            style={{
              marginTop: '1rem',
              fontWeight: 1000,
              color: response.includes('Successfully') ? '#98FB98' : '#FF0800',
            }}
          >
            {response}
          </p>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            marginTop: '20px',
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif',
            color: '#333',
          }}
        >
          <span
            onClick={() => navigate('/LogIn')}
            style={{
              marginLeft: '5px',
              textDecoration: 'none',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Already have an account?
          </span>
        </div>
      </form>
    </div>
  );
}

export default SignUp;
