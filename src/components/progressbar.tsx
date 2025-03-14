interface ProgressStepsProps {
    currentStep: number
    steps: {
      label: string
      title: string
    }[]
  }
  
  export default function ProgressSteps({ currentStep, steps }: ProgressStepsProps) {
    return (
      <div className="w-full max-w-md mb-12">
        <div className="relative flex items-start justify-between">
          {/* Progress Line */}
          <div className="absolute left-0 right-0 top-[15px] h-[1px] bg-zinc-800">
            <div
              className="h-full transition-all duration-300 bg-gradient-to-r from-[#FFD700] to-[#780991]"
              style={{
                width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
              }}
            />
          </div>
  
          {/* Steps */}
          {steps.map((step, index) => {
            const stepNumber = index + 1
            const isCompleted = stepNumber < currentStep
            const isCurrent = stepNumber === currentStep
  
            return (
              <div key={step.label} className="relative flex flex-col items-center">
                {/* Step Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted || isCurrent ? "bg-gradient-to-r from-[#FFD700] to-[#780991]" : "bg-zinc-800"
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-[15px] h-[14px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className={`text-[19px] ${isCurrent ? "text-white" : "text-zinc-400"}`}>{stepNumber}</span>
                  )}
                </div>
  
                {/* Step Label */}
                <div className="flex flex-col items-center mt-2">
                  <span className="text-[12px] uppercase text-[#a4a4a4] text-left">STEP {stepNumber}</span>
                  <span className={`text-[16px] ${isCurrent ? "text-white" : "text-zinc-400"}`}>{step.title}</span>
                  <div
                    className={`mt-1 px-3 py-0.5 rounded-full text-[15px] ${
                      isCompleted
                        ? "bg-gradient-to-r from-[#FFD700] to-[#780991] text-white"
                        : isCurrent
                          ? "bg-zinc-800 text-white"
                          : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {isCompleted ? "Completed" : isCurrent ? "In Progress" : "Pending"}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
  
  