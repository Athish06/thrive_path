import React, { useState, ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

export interface StepProps {
  children: ReactNode;
}

export const Step: React.FC<StepProps> = ({ children }) => {
  return <div>{children}</div>;
};

export interface StepperFooterContext {
  currentStep: number;
  totalSteps: number;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (step: number) => void;
}

interface StepperProps {
  children: React.ReactNode;
  initialStep?: number;
  currentStep?: number; // Add external control
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  backButtonText?: string;
  nextButtonText?: string;
  disabled?: boolean; // Add disabled prop
  renderFooter?: (context: StepperFooterContext) => ReactNode;
}

const Stepper: React.FC<StepperProps> = ({
  children,
  initialStep = 1,
  currentStep: externalCurrentStep,
  onStepChange,
  onFinalStepCompleted,
  backButtonText = "Previous",
  nextButtonText = "Next",
  disabled = false,
  renderFooter
}) => {
  const steps = React.Children.toArray(children) as React.ReactElement<StepProps>[];
  const [currentStep, setCurrentStep] = useState(initialStep);
  const totalSteps = steps.length;

  // Sync with external currentStep prop
  useEffect(() => {
    if (externalCurrentStep !== undefined && externalCurrentStep !== currentStep) {
      setCurrentStep(externalCurrentStep);
    }
  }, [externalCurrentStep, currentStep]);

  const goToNextStep = () => {
    if (currentStep < totalSteps) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onStepChange?.(nextStep);
    } else {
      onFinalStepCompleted?.();
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      onStepChange?.(prevStep);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
      onStepChange?.(step);
    }
  };

  const footerContext: StepperFooterContext = {
    currentStep,
    totalSteps,
    goToNextStep,
    goToPreviousStep,
    goToStep
  };

  return (
    <div className="w-full">
      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-16 px-4">
        <div className="flex items-center">
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            
            return (
              <React.Fragment key={stepNumber}>
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: isCompleted
                      ? 'rgb(139 92 246)' // violet-500
                      : isCurrent
                      ? 'rgb(139 92 246)' // violet-500
                      : 'rgb(226 232 240)', // slate-200 light mode
                    color: isCompleted || isCurrent ? 'white' : 'rgb(71 85 105)', // slate-600
                    scale: isCurrent ? 1.05 : 1
                  }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="w-10 h-10 rounded-full flex items-center justify-center font-semibold cursor-pointer shadow-md border-2 border-white dark:border-slate-800 relative z-10 dark:bg-slate-700 dark:text-slate-300"
                  style={{
                    backgroundColor: isCompleted || isCurrent 
                      ? 'rgb(139 92 246)' 
                      : undefined
                  }}
                  onClick={() => goToStep(stepNumber)}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : stepNumber}
                </motion.div>
                
                {stepNumber < totalSteps && (
                  <motion.div
                    initial={false}
                    animate={{
                      backgroundColor: isCompleted
                        ? 'rgb(139 92 246)' // violet-500
                        : 'rgb(226 232 240)' // slate-200
                    }}
                    transition={{ duration: 0.2 }}
                    className="w-16 h-1.5 mx-2 rounded-full dark:bg-slate-700"
                    style={{
                      backgroundColor: isCompleted 
                        ? 'rgb(139 92 246)' 
                        : undefined
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="mb-12 min-h-[400px]"
        >
          {steps[currentStep - 1]}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      {renderFooter ? (
        renderFooter(footerContext)
      ) : (
        <div className="flex justify-between">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={goToPreviousStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {backButtonText}
          </motion.button>

          <motion.button
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            onClick={goToNextStep}
            disabled={disabled}
            className={`flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl ${
              disabled 
                ? 'opacity-50 cursor-not-allowed hover:from-violet-500 hover:to-blue-500 hover:shadow-lg' 
                : 'hover:from-violet-600 hover:to-blue-600'
            }`}
          >
            {currentStep === totalSteps ? 'Complete' : nextButtonText}
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default Stepper;
