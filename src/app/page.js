// Home/page.js
"use client";
import { useState, useEffect } from "react";
import Header from "@/app/components/Header";
import dynamic from "next/dynamic";

export default function Home() {

  const Login_Modal = dynamic(() => import("@/app/components/Login_Modal"));
  const Login = dynamic(() => import("@/app/components/Login"));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => {
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      closeModal();
    }
  };
  
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="w-full mb-10">
        <Header />
      </div>
      <div>
        <button
          aria-label="Open Login Modal"
          className="text-center hover:bg-green-500 transition-colors shadow-md mt-10 p-3 bg-blue-500 text-white rounded-lg"
          onClick={openModal}
        >
          ورود به سامانه
        </button>
      </div>
      {isModalOpen && (
        <Login_Modal
          title="ورود به سامانه"
          onClose={closeModal}
          centered
          open={isModalOpen}
        >
          <Login />
        </Login_Modal>
      )}
    </main>
  );
}
