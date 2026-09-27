"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiChevronDown, FiChevronUp } from "react-icons/fi";

// FAQ data structure
const faqCategories = [
  {
    title: "Getting Started",
    questions: [
      {
        q: "How do I start searching for properties?",
        a: "You can start by using our search bar at the top of the page. Filter by location, property type, price range, and other criteria to find properties that match your needs.",
      },
      {
        q: "Do I need to create an account?",
        a: "While you can browse properties without an account, creating one allows you to save favorite properties, set up alerts, and contact agents directly.",
      },
      {
        q: "Is VectorAfriq free to use?",
        a: "Yes, VectorAfriq is completely free for property seekers. Agents and property owners may have different subscription plans for listing properties.",
      },
    ],
  },
  {
    title: "Property Listings",
    questions: [
      {
        q: "How often are properties updated?",
        a: "Our listings are updated in real-time as agents and property owners add or modify their listings. We also regularly verify listings to ensure accuracy.",
      },
      {
        q: "What if I find incorrect information in a listing?",
        a: 'You can report any inaccurate listings using the "Report" button on the property page. Our team will review and take appropriate action.',
      },
      {
        q: "Can I list my property for free?",
        a: "We offer different listing packages. Basic listings are free, while premium features require a subscription. Visit our pricing page for more details.",
      },
    ],
  },
  {
    title: "Contacting Agents",
    questions: [
      {
        q: "How do I contact an agent?",
        a: "Each property listing includes contact buttons for calling, emailing, or WhatsApp messaging the agent. You can also visit their profile page for more contact options.",
      },
      {
        q: "Are the agents verified?",
        a: 'Yes, all agents on VectorAfriq go through a verification process. Look for the "Verified" badge on agent profiles.',
      },
    ],
  },
  {
    title: "Account & Security",
    questions: [
      {
        q: "How do I reset my password?",
        a: 'Click on "Forgot Password" on the login page. Enter your email address, and we\'ll send you instructions to reset your password.',
      },
      {
        q: "Is my personal information secure?",
        a: "Yes, we use industry-standard encryption and security measures to protect your data. Read our Privacy Policy for more details.",
      },
    ],
  },
];

export default function FAQsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([]);

  const toggleQuestion = (question: string) => {
    setExpandedQuestions((current) =>
      current.includes(question)
        ? current.filter((q) => q !== question)
        : [...current, question]
    );
  };

  const filterQuestions = () => {
    if (!searchQuery) return faqCategories;

    return faqCategories
      .map((category) => ({
        ...category,
        questions: category.questions.filter(
          (q) =>
            q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.a.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }))
      .filter((category) => category.questions.length > 0);
  };

  const filteredCategories = filterQuestions();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b mt-20">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Frequently Asked Questions
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Find answers to common questions about VectorAfriq
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="container mx-auto px-4 py-6">
        <div className="relative max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-12 text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#468AD1] focus:ring-1 focus:ring-[#468AD1]"
          />
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* FAQ Categories */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {filteredCategories.map((category) => (
            <div key={category.title} className="bg-white rounded-lg shadow-sm">
              <h2 className="px-6 py-4 text-lg font-semibold text-gray-900 border-b">
                {category.title}
              </h2>
              <div className="divide-y">
                {category.questions.map((item) => (
                  <div key={item.q} className="p-6">
                    <button
                      onClick={() => toggleQuestion(item.q)}
                      className="w-full flex justify-between items-center text-left"
                    >
                      <span className="font-medium text-gray-900">
                        {item.q}
                      </span>
                      {expandedQuestions.includes(item.q) ? (
                        <FiChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <FiChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </button>
                    <AnimatePresence>
                      {expandedQuestions.includes(item.q) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className="mt-4 text-gray-600">{item.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Still Need Help Section */}
        <div className="max-w-3xl mx-auto mt-12 p-8 bg-[#514f63]/5 rounded-lg text-center">
          <h2 className="text-2xl font-bold text-[#514f63] mb-4">
            Still Need Help?
          </h2>
          <p className="text-[#514f63]/80 mb-6">
            Can&apos;t find what you&apos;re looking for? Our support team is
            here to help.
          </p>
          <button className="bg-[#468AD1] text-white px-8 py-3 rounded-lg hover:bg-[#2F6FAE] transition-colors">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
