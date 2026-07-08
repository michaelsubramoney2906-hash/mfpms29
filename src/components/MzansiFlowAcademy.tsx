import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { GraduationCap, BookOpen, CheckCircle, Clock, Award, ShieldAlert, ArrowLeft, Lock, Unlock, Download, Printer, AlertCircle, X, Sparkles } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { ACADEMY_DATA } from '../data/academyData';

interface MFAcademyProps {
  currentUser: User;
  activeTenantId: string;
}

type CourseId = 'opms-admin' | 'opms-political' | 'ipms' | 'mf-connect' | 'more';

interface CourseDef {
  id: CourseId;
  title: string;
  pointsCount: number;
  questionCount: number;
}

const COURSES: CourseDef[] = [
  { id: 'opms-admin', title: 'OPMS Admin', pointsCount: 50, questionCount: 30 },
  { id: 'opms-political', title: 'OPMS Political', pointsCount: 30, questionCount: 30 },
  { id: 'ipms', title: 'IPMS (Individual Performance)', pointsCount: 50, questionCount: 30 },
  { id: 'mf-connect', title: 'MF Connect', pointsCount: 10, questionCount: 5 },
  { id: 'more', title: 'MORE Framework', pointsCount: 30, questionCount: 15 },
];

export function MzansiFlowAcademy({ currentUser, activeTenantId }: MFAcademyProps) {
  const [activeCourse, setActiveCourse] = useState<CourseId | null>(null);
  const [mode, setMode] = useState<'menu' | 'learning' | 'assessment' | 'results'>('menu');
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [isExportingCert, setIsExportingCert] = useState(false);
  
  // Assessment state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({}); // Store answerIndex instead of 'A'
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState<any[]>([]);
  
  // Saved history for badges - PER USER
  const [history, setHistory] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(`academy_history_${currentUser.email}`);
    return saved ? JSON.parse(saved) : {};
  });

  const getCourseStatus = (cId: CourseId) => {
    const index = COURSES.findIndex(c => c.id === cId);
    if (index === 0) return { locked: false, reason: '' };
    
    const prevCourse = COURSES[index - 1];
    const prevScore = history[prevCourse.id] || 0;
    
    if (prevScore < 70) {
      return { 
        locked: true, 
        reason: `Requires completion of "${prevCourse.title}" with a block score of 70% or more. Current score: ${prevScore}%.`
      };
    }
    
    return { locked: false, reason: '' };
  };

  const isAllCompleted = COURSES.every(c => (history[c.id] || 0) >= 70);
  const completedCount = COURSES.filter(c => (history[c.id] || 0) >= 70).length;

  const handleDownloadCertificate = async () => {
    setIsExportingCert(true);
    try {
      const element = document.getElementById('academy-certificate-capture');
      if (!element) return;
      
      await document.fonts.ready;
      
      const canvas = await html2canvas(element, {
        scale: 2.2, // Crisp high-res capture
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#fbfbf9', // Matches stone color
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // A4 landscape sizing: 297mm x 210mm
      pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
      
      const userName = currentUser.fullName || currentUser.email.split('@')[0];
      const fileName = `MzansiFlow_Academy_Certificate_${userName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Failed to export Certificate PDF:', error);
    } finally {
      setIsExportingCert(false);
    }
  };

  useEffect(() => {
    let timer: any;
    if (mode === 'assessment' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (mode === 'assessment' && timeLeft === 0 && activeCourse) {
      finishAssessment();
    }
    return () => clearInterval(timer);
  }, [mode, timeLeft]);

  const course = COURSES.find(c => c.id === activeCourse);

  const startLearning = (id: CourseId) => {
    setActiveCourse(id);
    setMode('learning');
  };

  const startAssessment = () => {
    if (!course) return;
    
    const courseData = ACADEMY_DATA[course.id];
    if (courseData && courseData.questions) {
      // Shuffle questions so users get different orders
      const questionsCopy = [...courseData.questions].sort(() => Math.random() - 0.5);
      setShuffledQuestions(questionsCopy);
    } else {
      setShuffledQuestions([]);
    }

    setMode('assessment');
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimeLeft(course.questionCount * 60); // 1 minute per question
  };

  const finishAssessment = () => {
    if (!course) return;
    
    let correct = 0;
    for (let i = 0; i < shuffledQuestions.length; i++) {
        if (answers[i] === shuffledQuestions[i].answerIndex) {
            correct++;
        }
    }
    
    const finalScore = course.questionCount > 0 
      ? Math.round((correct / course.questionCount) * 100) 
      : 0;
      
    setScore(finalScore);
    
    // Save to history if better
    const currentBest = history[course.id] || 0;
    if (finalScore > currentBest) {
      const newHistory = { ...history, [course.id]: finalScore };
      setHistory(newHistory);
      localStorage.setItem(`academy_history_${currentUser.email}`, JSON.stringify(newHistory));
    }
    
    setMode('results');
  };

  const getBadge = (scoreValue: number) => {
    if (scoreValue >= 90) return { label: 'Gold Badge', color: 'bg-yellow-400 text-yellow-900 border-yellow-500' };
    if (scoreValue >= 80) return { label: 'Silver Badge', color: 'bg-slate-300 text-slate-800 border-slate-400' };
    if (scoreValue >= 70) return { label: 'Bronze Badge', color: 'bg-amber-600 text-white border-amber-700' };
    return { label: 'No Badge', color: 'bg-gray-100 text-gray-500 border-gray-200' };
  };

  if (mode === 'menu') {
    return (
      <div className="h-full bg-slate-50 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-indigo-600" />
                MzansiFlow Academy
              </h1>
              <p className="text-slate-500 font-medium mt-2">
                Complete learning modules and assessments to earn your certification badges.
              </p>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Signed in as</div>
              <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 border border-slate-200">
                {currentUser.fullName || currentUser.email}
              </div>
            </div>
          </div>

          {/* Progress & Certificate Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-0"></div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl -z-0"></div>

            <div className="space-y-3 z-10 w-full md:w-2/3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Academy Completion Status</span>
              </div>
              <h2 className="text-xl font-bold">
                {isAllCompleted 
                  ? "🎓 Congratulations! You are fully certified in Performance Management." 
                  : `Progress: ${completedCount} of ${COURSES.length} Modules Completed`
                }
              </h2>
              <div className="w-full bg-slate-800 rounded-full h-2.5">
                <div 
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${(completedCount / COURSES.length) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {isAllCompleted 
                    ? "You have excelled in all structural assessments and earned your Master Training Practitioner certificate."
                    : "Complete all modules sequentially with at least a 70% assessment score to unlock your official certification."
                  }
              </p>
            </div>

            <div className="z-10 shrink-0 w-full md:w-auto">
              {isAllCompleted ? (
                <button 
                  onClick={() => setShowCertificateModal(true)}
                  className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition flex items-center justify-center gap-2"
                >
                  <Award className="w-4 h-4" /> View & Download Certificate
                </button>
              ) : (
                <div className="px-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-center md:text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Master Certificate</span>
                  <span className="text-xs font-semibold text-slate-300 flex items-center justify-center md:justify-start gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-500/80" /> Locked ({completedCount}/{COURSES.length})
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {COURSES.map((c, idx) => {
              const bestScore = history[c.id];
              const badge = bestScore ? getBadge(bestScore) : null;
              const { locked, reason } = getCourseStatus(c.id);

              return (
                <div 
                  key={c.id} 
                  className={`p-6 rounded-2xl border transition relative overflow-hidden flex flex-col justify-between ${
                    locked 
                      ? 'bg-slate-50 border-slate-200 opacity-75 shadow-none' 
                      : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                  }`}
                >
                  {locked && (
                    <div className="absolute top-3 right-3 shrink-0 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                      <Lock className="w-4 h-4 text-slate-450" />
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-start mb-2 pr-6">
                      <h2 className={`text-xl font-bold ${locked ? 'text-slate-400' : 'text-slate-900'}`}>
                        {idx + 1}. {c.title}
                      </h2>
                    </div>

                    <div className="flex gap-2 mb-4 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-indigo-500" /> {c.pointsCount} Points
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-500" /> {c.questionCount} Questions
                      </span>
                      {badge && bestScore >= 70 && (
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${badge.color}`}>
                          {badge.label} ({bestScore}%)
                        </span>
                      )}
                    </div>

                    {locked ? (
                      <p className="text-xs text-slate-400 italic mb-6 leading-relaxed flex items-start gap-1.5 bg-slate-100/50 p-2.5 rounded-xl border border-slate-150">
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                        Access strategic curriculum slides, system compliance guidelines, PMS review parameters, and test your knowledge.
                      </p>
                    )}
                  </div>

                  <button 
                    onClick={() => !locked && startLearning(c.id)}
                    disabled={locked}
                    className={`w-full py-3 font-black uppercase tracking-widest text-xs rounded-xl transition ${
                      locked 
                        ? 'bg-slate-250 text-slate-400 cursor-not-allowed border border-slate-300' 
                        : 'bg-slate-950 hover:bg-slate-800 text-white cursor-pointer active:scale-98 shadow-sm'
                    }`}
                  >
                    {locked ? 'Module Locked' : 'Open Course Module'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Certificate Modal */}
        {showCertificateModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-6 relative flex flex-col max-h-[90vh]">
              <button 
                onClick={() => setShowCertificateModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-100 hover:bg-slate-200 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex justify-between items-center mb-6 border-b border-stone-100 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <Award className="w-4 h-4 text-amber-500" />
                    Academy Master Certification
                  </h3>
                  <p className="text-xs text-stone-550">Verify details and download your PMS completion credentials.</p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadCertificate}
                    disabled={isExportingCert}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-md transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isExportingCert ? (
                      <>
                        <Clock className="w-3.5 h-3.5 animate-spin" /> Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" /> Download PDF (PMS)
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-lg border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                </div>
              </div>

              {/* Overflow scroll wrapper representing standard landscape A4 aspect ratio 1.414 */}
              <div className="flex-1 overflow-auto bg-stone-100 p-4 rounded-2xl flex justify-center items-center">
                <div 
                  id="academy-certificate-capture"
                  className="bg-stone-50 border-[16px] border-double border-amber-700/80 p-8 rounded-none shadow-lg relative flex flex-col justify-between w-[840px] h-[594px] min-w-[840px] min-h-[594px] overflow-hidden font-sans"
                  style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(245, 240, 230, 0.4) 0%, rgba(235, 225, 210, 0.7) 100%)' }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-stone-200/25 pointer-events-none -z-0">
                    <GraduationCap className="w-80 h-80 stroke-[0.3]" />
                  </div>

                  <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-l-4 border-amber-600/40 m-2"></div>
                  <div className="absolute top-0 right-0 w-20 h-20 border-t-4 border-r-4 border-amber-600/40 m-2"></div>
                  <div className="absolute bottom-0 left-0 w-20 h-20 border-b-4 border-l-4 border-amber-600/40 m-2"></div>
                  <div className="absolute bottom-0 right-0 w-20 h-20 border-b-4 border-r-4 border-amber-600/40 m-2"></div>

                  <div className="text-center z-10 flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-center items-center gap-2 mb-1.5">
                        <GraduationCap className="w-7 h-7 text-amber-700" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-500">Official Certification Authority</span>
                      </div>
                      <h1 className="text-2xl font-serif font-extrabold tracking-wide text-amber-900 drop-shadow-sm uppercase">
                        Mzansi Flow Academy
                      </h1>
                      <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-600 compiled to-transparent w-2/3 mx-auto mt-1.5"></div>
                      <p className="text-[10px] font-bold tracking-widest text-emerald-800 uppercase mt-1">
                        Performance Management System
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] italic text-stone-500 font-serif"> This is to certify that </p>
                      <h2 className="text-xl font-black text-slate-900 my-2 tracking-wide font-sans underline decoration-amber-600/30 underline-offset-8">
                        {currentUser.fullName || currentUser.email}
                      </h2>
                      <p className="text-xs text-stone-600 leading-relaxed max-w-lg mx-auto">
                        has successfully completed all prescribed courses of study, rigorous competency evaluations, and practical workshops to achieve master practitioner status in the execution of the:
                      </p>
                      <p className="text-xs font-bold text-slate-800 mt-2.5 tracking-wide">
                        Performance Management System for Nkangala District Municipality
                      </p>
                      <p className="text-[11px] font-semibold text-emerald-800 mt-1 uppercase tracking-wider">
                        Financial Year Academic Cycle 2025/2026
                      </p>
                    </div>

                    <div className="flex justify-between items-end px-12 mt-3">
                      <div className="text-center w-36">
                        <div className="font-mono text-[9px] text-stone-800 border-b border-stone-400 pb-1 italic font-light">
                          M. Ndlovu
                        </div>
                        <div className="text-[8px] font-bold text-stone-550 uppercase tracking-wider mt-1">Municipal Manager</div>
                      </div>

                      <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-amber-600 border-4 border-double border-yellow-200 flex items-center justify-center shadow shadow-amber-800/10 relative">
                          <Award className="w-5 h-5 text-yellow-100" />
                          <div className="absolute top-[80%] left-[8%] w-3 h-8 bg-amber-700/80 rotate-[15deg] origin-top -z-10"></div>
                          <div className="absolute top-[80%] right-[8%] w-3 h-8 bg-amber-700/80 -rotate-[15deg] origin-top -z-10"></div>
                        </div>
                        <span className="text-[7.5px] font-bold tracking-widest text-slate-500 uppercase mt-3">
                          Exact Date: {new Date().toLocaleDateString('en-ZA', { dateStyle: 'long' })}
                        </span>
                      </div>

                      <div className="text-center w-36">
                        <div className="font-mono text-[9px] text-stone-800 border-b border-stone-400 pb-1 italic font-light">
                          A. van Dyk
                        </div>
                        <div className="text-[8px] font-bold text-stone-550 uppercase tracking-wider mt-1">Academy Chairperson</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (mode === 'learning' && course) {
    return (
      <div className="h-full bg-slate-50 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <button 
            onClick={() => setMode('menu')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-xs uppercase tracking-wider mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Academy
          </button>
          
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-black text-slate-900 border-b border-slate-100 pb-4 mb-6">
              {course.title}: Learning Materials
            </h2>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
              {ACADEMY_DATA[course.id]?.points.slice(0, course.pointsCount).map((point, i) => (
                <div key={i} className="flex gap-4 items-start p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="shrink-0 w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-700 font-black rounded-full text-xs">
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium pt-1">
                    {point}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
              <button 
                onClick={startAssessment}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-indigo-200 transition"
              >
                Proceed to Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'assessment' && course) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    return (
      <div className="h-full bg-slate-50 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-8">
              <h2 className="text-xl font-black text-slate-900">{course.title} Assessment</h2>
              <div className="flex items-center gap-2 bg-rose-50 text-rose-700 px-4 py-2 rounded-lg font-mono font-bold text-lg border border-rose-200 shadow-sm">
                <Clock className="w-5 h-5" />
                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">
                Question {currentQuestionIndex + 1} of {course.questionCount}
              </h3>
              <p className="text-lg font-bold text-slate-800 leading-relaxed mb-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
                {shuffledQuestions[currentQuestionIndex]?.question || 'Loading question...'}
              </p>
              
              <div className="space-y-3">
                {shuffledQuestions[currentQuestionIndex]?.options.map((optText: string, idx: number) => {
                  const letter = String.fromCharCode(65 + idx); // A, B, C, D
                  return (
                    <button
                      key={idx}
                      onClick={() => setAnswers({...answers, [currentQuestionIndex]: idx})}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all font-semibold ${
                        answers[currentQuestionIndex] === idx 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900' 
                          : 'border-slate-200 hover:border-indigo-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="inline-block w-6 font-black text-indigo-500 mr-2">{letter}.</span>
                      {optText}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-slate-100">
              <button 
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-2 bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              
              {currentQuestionIndex === course.questionCount - 1 ? (
                <button 
                  onClick={finishAssessment}
                  disabled={Object.keys(answers).length < course.questionCount}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-emerald-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Assessment
                </button>
              ) : (
                <button 
                  onClick={() => setCurrentQuestionIndex(Math.min(course.questionCount - 1, currentQuestionIndex + 1))}
                  className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg transition"
                >
                  Next Question
                </button>
              )}
            </div>
            
            {currentQuestionIndex === course.questionCount - 1 && Object.keys(answers).length < course.questionCount && (
              <p className="text-center text-rose-500 text-xs font-bold mt-4 uppercase tracking-wider">
                Please answer all questions before submitting. ({Object.keys(answers).length} / {course.questionCount})
              </p>
            )}

          </div>
        </div>
      </div>
    );
  }

  if (mode === 'results' && course) {
    const badge = getBadge(score);
    return (
      <div className="h-full bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-6">
          <div className={`w-24 h-24 mx-auto bg-slate-50 rounded-full flex items-center justify-center border-4 border-slate-100 mb-2`}>
            {score >= 70 ? (
              <Award className={`w-12 h-12 ${badge.color.includes('yellow') ? 'text-yellow-500' : badge.color.includes('slate') ? 'text-slate-400' : 'text-amber-600'}`} />
            ) : (
              <ShieldAlert className="w-12 h-12 text-rose-500" />
            )}
          </div>
          
          <div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">Assessment Complete</h2>
            <p className="text-slate-500 font-medium">{course.title}</p>
          </div>

          <div className="bg-slate-50 py-6 rounded-2xl border border-slate-100">
            <div className="text-5xl font-black text-slate-800 mb-2">{score}%</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Final Score</div>
          </div>

          {score >= 70 ? (
            <div className={`p-4 rounded-xl border font-black uppercase tracking-widest text-sm shadow-sm ${badge.color}`}>
              Earned: {badge.label}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 font-black uppercase tracking-widest text-sm">
              Failed - Requires 70%
            </div>
          )}

          <button 
            onClick={() => setMode('menu')}
            className="w-full py-4 mt-4 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg transition"
          >
            Return to Academy menu
          </button>
        </div>
      </div>
    );
  }

  return null;
}
