
import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
}

const Toast: React.FC<ToastProps> = ({ message }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true);
        const timer = setTimeout(() => {
            setVisible(false);
        }, 2800);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            className={`px-4 py-2 rounded-lg shadow-lg text-white font-semibold transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}`}
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
        >
            {message}
        </div>
    );
};

export default Toast;