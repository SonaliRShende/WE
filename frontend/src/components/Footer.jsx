import { Link } from "react-router-dom";
export default function Footer() {
  return (
    <footer className="bg-white border-t mt-16">
      <div className="container mx-auto py-8 px-6 text-center">
        <p className="mb-4">© {new Date().getFullYear()} EmpowerHer Platform.</p>
        <div className="space-x-4">
          <Link to="/" className="hover:text-pink-600">Home</Link>
          <Link to="#features" className="hover:text-pink-600">Features</Link>
          <Link to="#about" className="hover:text-pink-600">About</Link>
          <Link to="#contact" className="hover:text-pink-600">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
