// frontend/app/register/page.jsx
import RegisterForm from "../components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 shadow-lg rounded-lg p-8 w-full max-w-md">
        <h1 className="text-3xl mb-6 text-center">Create Account</h1>
        <RegisterForm />
      </div>
    </div>
  );
}
