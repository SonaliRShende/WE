import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import FeaturesSlider from "../components/FeaturesSlider";
import Footer from "../components/Footer";
import heroImg from "../assets/women-hero.jpg";
import { FaBriefcase, FaBullhorn, FaStar } from "react-icons/fa";

export default function Landing() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-pink-50 via-blue-50 to-purple-50">
      <Navbar />
     <section
  className="relative w-full h-[90vh] bg-cover flex  justify-center px-6 md:px-20"
  style={{
    backgroundImage: `url(${heroImg})`,
  }}
>
  <motion.div
    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-3xl text-center text-white p-6 bg-gradient-to-b from-slate-300 to-purple-350 bg-opacity-50 rounded-lg"
    variants={container}
    initial="hidden"
    animate="show"
  >
    <motion.h1
      className="text-4xl md:text-5xl font-extrabold mb-4"
      variants={fadeInUp}
    >
      <span className="text-blue-500">Find.</span>{" "}
      <span className="text-pink-500">Offer.</span>{" "}
      <span className="text-purple-500">Grow.</span>
    </motion.h1>

    <motion.p className="text-lg text-black md:text-xl mb-8" variants={fadeInUp}>
      Opportunities for every woman.
    </motion.p>

    <motion.div
      className="grid grid-cols-1 sm:grid-cols-3 gap-6"
      variants={fadeInUp}
    >
      <a
        href="/register?role=job-seeker"
        className="bg-white text-black p-6 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition text-center"
      >
        <FaBriefcase className="mx-auto text-pink-500 text-4xl mb-4" />
        <h3 className="text-xl font-semibold mb-2">Find Work</h3>
        <p className="text-gray-600 text-sm">Jobs that fit your life.</p>
      </a>

      <a
        href="/register?role=job-provider"
        className="bg-white text-black p-6 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition text-center"
      >
        <FaBullhorn className="mx-auto text-purple-500 text-4xl mb-4" />
        <h3 className="text-xl font-semibold mb-2">Offer Work</h3>
        <p className="text-gray-600 text-sm">Share opportunities and hire.</p>
      </a>

      <a
        href="/register?role=entrepreneur"
        className="bg-white text-black p-6 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition text-center"
      >
        <FaStar className="mx-auto text-blue-500 text-4xl mb-4" />
        <h3 className="text-xl font-semibold mb-2">Entrepreneur</h3>
        <p className="text-gray-600 text-sm">Showcase services & business.</p>
      </a>
    </motion.div>
  </motion.div>
</section>


      <Footer />
    </div>
  );
}
