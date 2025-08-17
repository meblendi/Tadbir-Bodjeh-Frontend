// components/Modal.js
"use client";

import React, { useEffect, useRef, useState } from "react";

const Modal = ({ children, onClose }) => {
  const modalRef = useRef();
  const [animation, setAnimation] = useState("modal-enter");

  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      setAnimation("modal-exit");
      setTimeout(() => {
        onClose();
      }, 300); // Match the animation duration
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      handleClose();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleClose = () => {
    setAnimation("modal-exit");
    setTimeout(() => {
      onClose();
    }, 300); // Match the animation duration
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
      role="dialog"
      aria-hidden="true"
    >
      <div
        ref={modalRef}
        className={`relative bg-white p-6 rounded shadow-lg ${animation}`}
      >
        <div className="m-1 p-2">
          <button
            className="bg-gray-100 px-2 pb-0.5 rounded absolute top-2 right-2 text-gray-500 hover:bg-red-400 hover:text-white"
            onClick={handleClose}
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
