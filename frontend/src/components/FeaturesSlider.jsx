import React from "react";

const cards = [
  { title: "Voice-Based Access", descr: "Interact with voice commands and audio feedback" },
  { title: "Flexible Scheduling", descr: "Match jobs to your available hours" },
  { title: "Smart Matching", descr: "AI recommends suitable opportunities" },
];

export default function FeaturesSlider() {
  return (
    <div id="features" className="py-3 bg-gray-100">
      <h2 className="text-4xl font-bold text-center mb-8">Our Features</h2>
      <div className="container mx-auto flex space-x-4 overflow-x-auto pb-4">
        {cards.map((c, idx) => (
          <div key={idx} className="min-w-sm bg-white p-6 rounded-lg shadow-md flex-shrink-0">
            <h3 className="text-xl font-semibold mb-2">{c.title}</h3>
            <p>{c.descr}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
