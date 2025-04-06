import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function AccountDashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    const user = location.state?.user;

    useEffect(() => {
        if (!user) {
            navigate("/LogIn");
        }
    }, [user, navigate]);

    if (!user) return null;

    return (
        <div>
            <h1>Welcome {user.name}</h1>
            <p>Email: {user.email}</p>
            <p>Password: {user.password}</p>
        </div>
    );
}

export default AccountDashboard;
