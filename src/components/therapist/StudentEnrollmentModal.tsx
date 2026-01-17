import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Target, FileUp, FileText, ClipboardList, Info, BarChart3 } from 'lucide-react';
import Stepper, { Step } from '../ui/Stepper';
import { CustomDatePicker } from '../ui/CustomDatePicker';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { API_BASE_URL } from '../../config/api';

interface StudentEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface StudentData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  diagnosis: string;
  goals: string[];
  // New fields
  driveUrl?: string;
  originalFileName?: string; // Store original filename
  priorDiagnosis?: boolean;
  medicalDiagnosis: any; // JSON template provided
  profileInfo?: any; // Optional JSON
  // Assessment fields
  selectedAssessmentTools: string[];
  assessmentDetails: {
    [toolId: string]: {
      [itemId: string]: number; // item scores
    };
  };
}

export const StudentEnrollmentModal: React.FC<StudentEnrollmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { refreshLearners, refreshTempStudents } = useData();

  // Enhanced close handler to reset state
  const handleClose = () => {
    // Reset form completely including auto-filled data
    setStudentData({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      diagnosis: '',
      goals: [],
      priorDiagnosis: false,
      driveUrl: undefined,
      originalFileName: undefined,
      medicalDiagnosis: {
        prenatal_and_birth_history: {
          mothers_age_at_delivery: null,
          pregnancy_illnesses_medication: '',
          length_of_pregnancy_weeks: null,
          delivery_type: '',
          difficulties_at_birth: '',
          birth_cry: '',
          birth_weight_kg: null
        },
        medical_history: {
          illnesses: {
            allergies: { has: false, age_at_onset: null, notes: '' },
            convulsions: { has: false, age_at_onset: null, notes: '' },
            head_injury: { has: false, age_at_onset: null, notes: '' },
            visual_problems: { has: false, age_at_onset: null, notes: '' },
            dental_problems: { has: false, age_at_onset: null, notes: '' },
            high_fever: { has: false, age_at_onset: null, notes: '' },
            ear_infections: { has: false, age_at_onset: null, notes: '' },
            hearing_problems: { has: false, age_at_onset: null, notes: '' }
          },
          other_health_issues: '',
          current_medication: '',
          specific_diet: '',
          vaccination_details: ''
        },
        developmental_history: {
          motor_milestones: {
            turning_over_age_months: null,
            sitting_age_months: null,
            crawling_age_months: null,
            walking_age_months: null,
            motor_coordination_difficulties: ''
          },
          speech_milestones: {
            babbling_age_months: null,
            first_word_age_months: null,
            use_of_words_age_months: null,
            combining_words_age_months: null,
            regression_observed: false
          },
          toilet_training: {
            status: '',
            mode_of_indication: ''
          }
        },
        feeding_and_oromotor_skills: {
          drinking_from_cup: false,
          eating_solid_food: false,
          using_a_spoon: false,
          difficulties: {
            sucking: false,
            swallowing: false,
            chewing: false,
            blowing: false
          },
          food_texture_sensitivity: '',
          gag_choke_issues: false,
          mealtime_behavioral_problems: '',
          mouthing_objects: '',
          drooling: ''
        },
        sleeping_pattern: '',
        behavioral_issues: {
          aggression: { reported: false, observed: false },
          anger: { reported: false, observed: false },
          abnormal_fears: { reported: false, observed: false, details: '' },
          biting: { reported: false, observed: false },
          excessive_crying: { reported: false, observed: false },
          head_banging: { reported: false, observed: false },
          temper_tantrums: { reported: false, observed: false }
        },
        sensory_and_motor_stereotypes: '',
        previous_evaluations: []
      },
      profileInfo: {
        complaint_primary: '',
        referred_by: '',
        family_information: {
          father: { name: '', age: null, education: '', occupation: '', monthly_income: null },
          mother: { name: '', age: null, education: '', occupation: '', monthly_income: null },
          family_history: {
            late_talkers: '',
            genetic_disorders: '',
            sibling_details: [],
            family_type: '',
            child_care_details: '',
            parent_child_interaction: ''
          }
        },
        language_profile: { primary_language_at_home: '', other_languages_exposed_to: [] },
        social_and_play_skills: {
          development_of_play: '',
          play_pattern: '',
          peer_interaction: ''
        },
        educational_details: {
          school_name_and_location: '',
          type_of_school: '',
          hours_of_schooling: null,
          start_age_and_current_grade: '',
          concerns_from_school: '',
          support_from_school: ''
        },
        current_status_observation: {
          eye_contact: { reported: '', observed: '' },
          attention: { reported: '', observed: '' },
          sitting_tolerance: { reported: '', observed: '' },
          compliance: { reported: '', observed: '' },
          response_to_name: { reported: '', observed: '' }
        },
        parent_observations_and_needs: ''
      },
      selectedAssessmentTools: [],
      assessmentDetails: {}
    });
    setCurrentStep(1); // Reset to first step
    setOcrResult(null);
    setShowOcrSuccess(false);
    setUploadError(null);
    setSkipProfile(false);
    setCurrentGoal('');
    setAutoFillOccurred(false); // Reset auto-fill state
    onClose();
  };
  const [studentData, setStudentData] = useState<StudentData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    diagnosis: '',
    goals: [],
    priorDiagnosis: false,
    driveUrl: undefined,
    originalFileName: undefined,
    // Initialize with empty/default values (no prefilled content)
    medicalDiagnosis: {
      prenatal_and_birth_history: {
        mothers_age_at_delivery: null,
        pregnancy_illnesses_medication: '',
        length_of_pregnancy_weeks: null,
        delivery_type: '',
        difficulties_at_birth: '',
        birth_cry: '',
        birth_weight_kg: null
      },
      medical_history: {
        illnesses: {
          allergies: { has: false, age_at_onset: null, notes: '' },
          convulsions: { has: false, age_at_onset: null, notes: '' },
          head_injury: { has: false, age_at_onset: null, notes: '' },
          visual_problems: { has: false, age_at_onset: null, notes: '' },
          dental_problems: { has: false, age_at_onset: null, notes: '' },
          high_fever: { has: false, age_at_onset: null, notes: '' },
          ear_infections: { has: false, age_at_onset: null, notes: '' },
          hearing_problems: { has: false, age_at_onset: null, notes: '' }
        },
        other_health_issues: '',
        current_medication: '',
        specific_diet: '',
        vaccination_details: ''
      },
      developmental_history: {
        motor_milestones: {
          turning_over_age_months: null,
          sitting_age_months: null,
          crawling_age_months: null,
          walking_age_months: null,
          motor_coordination_difficulties: ''
        },
        speech_milestones: {
          babbling_age_months: null,
          first_word_age_months: null,
          use_of_words_age_months: null,
          combining_words_age_months: null,
          regression_observed: false
        },
        toilet_training: {
          status: '',
          mode_of_indication: ''
        }
      },
      feeding_and_oromotor_skills: {
        drinking_from_cup: false,
        eating_solid_food: false,
        using_a_spoon: false,
        difficulties: {
          sucking: false,
          swallowing: false,
          chewing: false,
          blowing: false
        },
        food_texture_sensitivity: '',
        gag_choke_issues: false,
        mealtime_behavioral_problems: '',
        mouthing_objects: '',
        drooling: ''
      },
      sleeping_pattern: '',
      behavioral_issues: {
        aggression: { reported: false, observed: false },
        anger: { reported: false, observed: false },
        abnormal_fears: { reported: false, observed: false, details: '' },
        biting: { reported: false, observed: false },
        excessive_crying: { reported: false, observed: false },
        head_banging: { reported: false, observed: false },
        temper_tantrums: { reported: false, observed: false }
      },
      sensory_and_motor_stereotypes: '',
      previous_evaluations: []
    },
    profileInfo: {
      complaint_primary: '',
      referred_by: '',
      family_information: {
        father: { name: '', age: null, education: '', occupation: '', monthly_income: null },
        mother: { name: '', age: null, education: '', occupation: '', monthly_income: null },
        family_history: {
          late_talkers: '',
          genetic_disorders: '',
          sibling_details: [],
          family_type: '',
          child_care_details: '',
          parent_child_interaction: ''
        }
      },
      language_profile: { primary_language_at_home: '', other_languages_exposed_to: [] },
      social_and_play_skills: {
        development_of_play: '',
        play_pattern: '',
        peer_interaction: ''
      },
      educational_details: {
        school_name_and_location: '',
        type_of_school: '',
        hours_of_schooling: null,
        start_age_and_current_grade: '',
        concerns_from_school: '',
        support_from_school: ''
      },
      current_status_observation: {
        eye_contact: { reported: '', observed: '' },
        attention: { reported: '', observed: '' },
        sitting_tolerance: { reported: '', observed: '' },
        compliance: { reported: '', observed: '' },
        response_to_name: { reported: '', observed: '' }
      },
      parent_observations_and_needs: ''
    },
    // Assessment fields
    selectedAssessmentTools: [],
    assessmentDetails: {}
  });
  const [currentGoal, setCurrentGoal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skipProfile, setSkipProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [showOcrSuccess, setShowOcrSuccess] = useState(false);
  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);
  // Auto-fill state
  const [autoFillOccurred, setAutoFillOccurred] = useState(false);
  // Assessment state
  const [currentAssessmentIndex, setCurrentAssessmentIndex] = useState(0);
  const hasRecordedAssessmentScores = useMemo(() =>
    Object.values(studentData.assessmentDetails).some(tool => tool && Object.keys(tool).length > 0),
    [studentData.assessmentDetails]);

  // Assessment items data
  const assessmentItems = {
    'isaa': {
      name: 'ISAA (Indian Scale for Assessment of Autism)',
      items: [
        // Social Interaction (Items 1-10)
        "Makes eye contact during interaction",
        "Responds to name being called",
        "Smiles back when smiled at",
        "Shows interest in other children",
        "Shares toys or objects with others",
        "Participates in group activities",
        "Understands social cues and gestures",
        "Takes turns in conversation",
        "Shows empathy or concern for others",
        "Engages in pretend play with others",

        // Communication (Items 11-20)
        "Uses single words to communicate",
        "Combines words into simple sentences",
        "Uses gestures to communicate needs",
        "Follows simple instructions",
        "Asks questions appropriately",
        "Describes daily activities",
        "Uses appropriate tone of voice",
        "Maintains topic in conversation",
        "Understands jokes and sarcasm",
        "Uses language for social purposes",

        // Behavior Patterns (Items 21-30)
        "Follows routines and schedules",
        "Handles transitions between activities",
        "Shows flexibility in thinking",
        "Accepts changes in environment",
        "Manages frustration appropriately",
        "Controls impulses and emotions",
        "Waits for turn in activities",
        "Follows classroom rules",
        "Adapts to new situations",
        "Shows self-control in challenging situations",

        // Sensory Processing (Items 31-35)
        "Responds appropriately to sensory input",
        "Tolerates different textures",
        "Handles loud noises without distress",
        "Adapts to different lighting conditions",
        "Processes sensory information accurately",

        // Motor Skills (Items 36-40)
        "Uses fine motor skills for writing/drawing",
        "Demonstrates gross motor coordination",
        "Maintains balance during movement",
        "Coordinates both sides of body",
        "Uses motor skills for daily activities"
      ]
    },
    'indt-adhd': {
      name: 'INDT-ADHD (Indian Scale for ADHD)',
      items: [
        "Has difficulty sustaining attention in tasks",
        "Often leaves seat when expected to remain seated",
        "Runs about or climbs excessively in inappropriate situations",
        "Has difficulty playing quietly",
        "Is often 'on the go' as if driven by a motor",
        "Talks excessively",
        "Blurts out answers before questions are completed",
        "Has difficulty awaiting turn",
        "Interrupts or intrudes on others",
        "Often loses things necessary for tasks",
        "Engages in dangerous activities without considering consequences",
        "Has difficulty organizing tasks and activities",
        "Avoids tasks requiring sustained mental effort",
        "Is easily distracted by extraneous stimuli",
        "Is forgetful in daily activities"
      ]
    },
    'clinical-snapshots': {
      name: 'Clinical Snapshots',
      items: [
        "Maintains eye contact during interaction",
        "Responds to social overtures from others",
        "Initiates social interactions appropriately",
        "Uses nonverbal communication effectively",
        "Demonstrates appropriate facial expressions",
        "Shows awareness of personal space",
        "Engages in reciprocal conversation",
        "Demonstrates theory of mind skills",
        "Shows interest in peer activities",
        "Adapts behavior based on social context",
        "Demonstrates self-awareness",
        "Shows appropriate emotional responses",
        "Uses communication for various purposes",
        "Demonstrates problem-solving skills",
        "Shows independence in daily activities"
      ]
    }
  };

  // ConditionalTooltip component
  const ConditionalTooltip = ({ fieldValue, text }: { fieldValue: any; text: string }) => {
    const shouldShow = autoFillOccurred || (fieldValue && fieldValue.toString().trim() !== '');
    return (
      <div className={`absolute bottom-full left-0 mb-2 bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 ${shouldShow ? 'group-hover:block hidden' : 'hidden'}`}>
        {text}
      </div>
    );
  };

  // Function to scroll to top of modal content
  const scrollToTop = () => {
    const modalContent = document.querySelector('.enroll-modal .overflow-y-auto');
    if (modalContent) {
      modalContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle step change with scroll to top
  const handleStepChange = (step: number) => {
    setCurrentStep(step);
    setTimeout(scrollToTop, 100); // Small delay to ensure step content is rendered
  };

  // Effect to scroll to top when step changes
  useEffect(() => {
    scrollToTop();
  }, [currentStep]);

  // Initialize assessment index when tools change
  useEffect(() => {
    if (studentData.selectedAssessmentTools.length > 0 && currentAssessmentIndex >= studentData.selectedAssessmentTools.length) {
      setCurrentAssessmentIndex(0);
    }
  }, [studentData.selectedAssessmentTools, currentAssessmentIndex]);

  // Shared styling for all checkboxes to avoid stark white fill
  const checkboxClass = useMemo(
    () => 'form-checkbox h-4 w-4 rounded-md accent-slate-700 dark:accent-slate-200 focus:ring-slate-500 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600',
    []
  );

  const handleInputChange = (field: keyof StudentData, value: string) => {
    setStudentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addGoal = () => {
    if (currentGoal.trim() && studentData.goals.length < 5) {
      setStudentData(prev => ({
        ...prev,
        goals: [...prev.goals, currentGoal.trim()]
      }));
      setCurrentGoal('');
    }
  };

  const removeGoal = (index: number) => {
    setStudentData(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index)
    }));
  };

  // Helper function to auto-fill form data from OCR results for all 3 steps
  const fillFormFromOCR = (ocrData: any) => {
    if (!ocrData) return;

    try {
      // Set autofill state to true when autofill occurs
      setAutoFillOccurred(true);

      setStudentData(prev => {
        const newData = { ...prev };

        // STEP 1: Auto-fill basic information
        if (ocrData.step1_basic_info) {
          const basicInfo = ocrData.step1_basic_info;

          if (basicInfo.first_name && !newData.firstName) {
            newData.firstName = basicInfo.first_name;
          } else if (basicInfo.patient_name && !newData.firstName && !newData.lastName) {
            const nameParts = basicInfo.patient_name.split(' ');
            if (nameParts.length >= 2) {
              newData.firstName = nameParts[0];
              newData.lastName = nameParts.slice(1).join(' ');
            }
          }

          if (basicInfo.last_name && !newData.lastName) {
            newData.lastName = basicInfo.last_name;
          }

          if (basicInfo.date_of_birth && !newData.dateOfBirth) {
            newData.dateOfBirth = basicInfo.date_of_birth;
          }
        }

        // STEP 2: Auto-fill profile information
        if (ocrData.step2_profile_info) {
          const profileInfo = ocrData.step2_profile_info;

          if (profileInfo.primary_complaint && !newData.profileInfo.complaint_primary) {
            newData.profileInfo.complaint_primary = profileInfo.primary_complaint;
          }

          if (profileInfo.referred_by && !newData.profileInfo.referred_by) {
            newData.profileInfo.referred_by = profileInfo.referred_by;
          }

          if (profileInfo.diagnosis && !newData.diagnosis) {
            newData.diagnosis = profileInfo.diagnosis;
          }

          // Family information
          if (profileInfo.family_info) {
            const familyInfo = profileInfo.family_info;

            if (familyInfo.father) {
              const father = familyInfo.father;
              if (father.name && !newData.profileInfo.family_information.father.name) {
                newData.profileInfo.family_information.father.name = father.name;
              }
              if (father.age && !newData.profileInfo.family_information.father.age) {
                newData.profileInfo.family_information.father.age = father.age;
              }
              if (father.education && !newData.profileInfo.family_information.father.education) {
                newData.profileInfo.family_information.father.education = father.education;
              }
              if (father.occupation && !newData.profileInfo.family_information.father.occupation) {
                newData.profileInfo.family_information.father.occupation = father.occupation;
              }
            }

            if (familyInfo.mother) {
              const mother = familyInfo.mother;
              if (mother.name && !newData.profileInfo.family_information.mother.name) {
                newData.profileInfo.family_information.mother.name = mother.name;
              }
              if (mother.age && !newData.profileInfo.family_information.mother.age) {
                newData.profileInfo.family_information.mother.age = mother.age;
              }
              if (mother.education && !newData.profileInfo.family_information.mother.education) {
                newData.profileInfo.family_information.mother.education = mother.education;
              }
              if (mother.occupation && !newData.profileInfo.family_information.mother.occupation) {
                newData.profileInfo.family_information.mother.occupation = mother.occupation;
              }
            }

            if (familyInfo.family_history) {
              const history = familyInfo.family_history;
              if (history.late_talkers && !newData.profileInfo.family_information.family_history.late_talkers) {
                newData.profileInfo.family_information.family_history.late_talkers = history.late_talkers;
              }
              if (history.genetic_disorders && !newData.profileInfo.family_information.family_history.genetic_disorders) {
                newData.profileInfo.family_information.family_history.genetic_disorders = history.genetic_disorders;
              }
              if (history.family_type && !newData.profileInfo.family_information.family_history.family_type) {
                newData.profileInfo.family_information.family_history.family_type = history.family_type;
              }
            }
          }

          // Language profile
          if (profileInfo.language_profile) {
            if (profileInfo.language_profile.primary_language && !newData.profileInfo.language_profile.primary_language_at_home) {
              newData.profileInfo.language_profile.primary_language_at_home = profileInfo.language_profile.primary_language;
            }
          }

          // Educational details
          if (profileInfo.educational_details) {
            const edu = profileInfo.educational_details;
            if (edu.school_name && !newData.profileInfo.educational_details.school_name_and_location) {
              newData.profileInfo.educational_details.school_name_and_location = edu.school_name;
            }
            if (edu.school_type && !newData.profileInfo.educational_details.type_of_school) {
              newData.profileInfo.educational_details.type_of_school = edu.school_type;
            }
            if (edu.current_grade && !newData.profileInfo.educational_details.start_age_and_current_grade) {
              newData.profileInfo.educational_details.start_age_and_current_grade = edu.current_grade;
            }
            if (edu.school_concerns && !newData.profileInfo.educational_details.concerns_from_school) {
              newData.profileInfo.educational_details.concerns_from_school = edu.school_concerns;
            }
          }
        }

        // STEP 3: Auto-fill medical information (existing logic updated for new structure)
        if (ocrData.step3_medical_info) {
          const medicalInfo = ocrData.step3_medical_info;

          // Prenatal and birth history
          if (medicalInfo.prenatal_birth_history) {
            const birthHistory = medicalInfo.prenatal_birth_history;
            const currentBirthHistory = newData.medicalDiagnosis.prenatal_and_birth_history;

            if (birthHistory.mothers_age_at_delivery && !currentBirthHistory.mothers_age_at_delivery) {
              newData.medicalDiagnosis.prenatal_and_birth_history.mothers_age_at_delivery = birthHistory.mothers_age_at_delivery;
            }

            if (birthHistory.pregnancy_illnesses_medication && !currentBirthHistory.pregnancy_illnesses_medication) {
              newData.medicalDiagnosis.prenatal_and_birth_history.pregnancy_illnesses_medication = birthHistory.pregnancy_illnesses_medication;
            }

            if (birthHistory.length_of_pregnancy_weeks && !currentBirthHistory.length_of_pregnancy_weeks) {
              newData.medicalDiagnosis.prenatal_and_birth_history.length_of_pregnancy_weeks = birthHistory.length_of_pregnancy_weeks;
            }

            if (birthHistory.delivery_type && !currentBirthHistory.delivery_type) {
              newData.medicalDiagnosis.prenatal_and_birth_history.delivery_type = birthHistory.delivery_type;
            }

            if (birthHistory.difficulties_at_birth && !currentBirthHistory.difficulties_at_birth) {
              newData.medicalDiagnosis.prenatal_and_birth_history.difficulties_at_birth = birthHistory.difficulties_at_birth;
            }

            if (birthHistory.birth_cry && !currentBirthHistory.birth_cry) {
              newData.medicalDiagnosis.prenatal_and_birth_history.birth_cry = birthHistory.birth_cry;
            }

            if (birthHistory.birth_weight_kg && !currentBirthHistory.birth_weight_kg) {
              newData.medicalDiagnosis.prenatal_and_birth_history.birth_weight_kg = birthHistory.birth_weight_kg;
            }
          }

          // Medical history
          if (medicalInfo.medical_history) {
            const medHistory = medicalInfo.medical_history;
            const currentMedHistory = newData.medicalDiagnosis.medical_history;

            // Fill illnesses with boolean conditions
            const illnessKeys = ['allergies', 'convulsions', 'head_injury', 'visual_problems', 'hearing_problems'];
            illnessKeys.forEach(key => {
              if (medHistory[key]?.has && !currentMedHistory.illnesses[key].has) {
                newData.medicalDiagnosis.medical_history.illnesses[key].has = medHistory[key].has;
                if (medHistory[key].details) {
                  newData.medicalDiagnosis.medical_history.illnesses[key].notes = medHistory[key].details;
                }
              }
            });

            // Fill text fields
            if (medHistory.other_health_issues && !currentMedHistory.other_health_issues) {
              newData.medicalDiagnosis.medical_history.other_health_issues = medHistory.other_health_issues;
            }

            if (medHistory.current_medication && !currentMedHistory.current_medication) {
              newData.medicalDiagnosis.medical_history.current_medication = medHistory.current_medication;
            }

            if (medHistory.vaccination_details && !currentMedHistory.vaccination_details) {
              newData.medicalDiagnosis.medical_history.vaccination_details = medHistory.vaccination_details;
            }

            if (medHistory.specific_diet && !currentMedHistory.specific_diet) {
              newData.medicalDiagnosis.medical_history.specific_diet = medHistory.specific_diet;
            }
          }

          // Developmental milestones
          if (medicalInfo.developmental_milestones) {
            const devMilestones = medicalInfo.developmental_milestones;
            const currentMotor = newData.medicalDiagnosis.developmental_history.motor_milestones;
            const currentSpeech = newData.medicalDiagnosis.developmental_history.speech_milestones;

            const motorMilestones = {
              'turning_over_months': 'turning_over_age_months',
              'sitting_months': 'sitting_age_months',
              'crawling_months': 'crawling_age_months',
              'walking_months': 'walking_age_months'
            };

            Object.entries(motorMilestones).forEach(([ocrKey, formKey]) => {
              if (devMilestones[ocrKey] && !currentMotor[formKey]) {
                newData.medicalDiagnosis.developmental_history.motor_milestones[formKey] = devMilestones[ocrKey];
              }
            });

            const speechMilestones = {
              'babbling_months': 'babbling_age_months',
              'first_word_months': 'first_word_age_months',
              'use_of_words_months': 'use_of_words_age_months',
              'combining_words_months': 'combining_words_age_months'
            };

            Object.entries(speechMilestones).forEach(([ocrKey, formKey]) => {
              if (devMilestones[ocrKey] && !currentSpeech[formKey]) {
                newData.medicalDiagnosis.developmental_history.speech_milestones[formKey] = devMilestones[ocrKey];
              }
            });

            if (devMilestones.toilet_training_status && !newData.medicalDiagnosis.developmental_history.toilet_training.status) {
              newData.medicalDiagnosis.developmental_history.toilet_training.status = devMilestones.toilet_training_status;
            }
          }

          // Feeding skills
          if (medicalInfo.feeding_skills) {
            const feedingSkills = medicalInfo.feeding_skills;
            const currentFeeding = newData.medicalDiagnosis.feeding_and_oromotor_skills;

            const feedingBooleans = {
              'drinking_from_cup': 'drinking_from_cup',
              'eating_solid_food': 'eating_solid_food',
              'using_spoon': 'using_a_spoon'
            };

            Object.entries(feedingBooleans).forEach(([ocrKey, formKey]) => {
              if (feedingSkills[ocrKey] !== null && feedingSkills[ocrKey] !== currentFeeding[formKey]) {
                newData.medicalDiagnosis.feeding_and_oromotor_skills[formKey] = feedingSkills[ocrKey];
              }
            });

            if (feedingSkills.food_texture_sensitivity && !currentFeeding.food_texture_sensitivity) {
              newData.medicalDiagnosis.feeding_and_oromotor_skills.food_texture_sensitivity = feedingSkills.food_texture_sensitivity;
            }

            if (feedingSkills.drooling && !currentFeeding.drooling) {
              newData.medicalDiagnosis.feeding_and_oromotor_skills.drooling = feedingSkills.drooling;
            }
          }

          // Behavioral issues
          if (medicalInfo.behavioral_issues) {
            const behaviorIssues = medicalInfo.behavioral_issues;

            if (behaviorIssues.sleeping_pattern && !newData.medicalDiagnosis.sleeping_pattern) {
              newData.medicalDiagnosis.sleeping_pattern = behaviorIssues.sleeping_pattern;
            }

            const behaviorKeys = ['aggression', 'temper_tantrums', 'abnormal_fears'];
            behaviorKeys.forEach(key => {
              if (behaviorIssues[key] && key in newData.medicalDiagnosis.behavioral_issues) {
                if (key === 'abnormal_fears') {
                  newData.medicalDiagnosis.behavioral_issues[key].reported = true;
                  newData.medicalDiagnosis.behavioral_issues[key].details = behaviorIssues[key];
                } else if (key === 'temper_tantrums') {
                  newData.medicalDiagnosis.behavioral_issues[key].reported = true;
                } else {
                  newData.medicalDiagnosis.behavioral_issues[key].reported = true;
                }
              }
            });
          }
        }

        // Set prior diagnosis if any medical conditions are found
        if (ocrData.step3_medical_info?.medical_history?.other_health_issues ||
          ocrData.step3_medical_info?.medical_history?.current_medication ||
          Object.values(ocrData.step3_medical_info?.medical_history || {}).some(item =>
            typeof item === 'object' && item !== null && 'has' in item && (item as any).has === true)) {
          newData.priorDiagnosis = true;
        }

        return newData;
      });

      // Show success indication
      setShowOcrSuccess(true);

      // Auto-dismiss the notification after 3 seconds
      setTimeout(() => {
        setShowOcrSuccess(false);
      }, 3000);

      console.log('Form auto-filled from OCR data for all 3 steps:', ocrData);
    } catch (error) {
      console.error('Error filling form from OCR:', error);
    }
  };

  // (Removed unused shouldShowTooltip function)

  // Helper function to delete uploaded file
  const deleteUploadedFile = async () => {
    if (!studentData.driveUrl) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/delete-file`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storage_path: studentData.driveUrl }),
      });

      if (response.ok) {
        setStudentData(prev => ({
          ...prev,
          driveUrl: undefined,
          originalFileName: undefined
        }));
        setOcrResult(null);
        setShowOcrSuccess(false);
        setUploadError(null);

        // Clear any auto-filled data when file is deleted
        // Note: We intentionally don't reset the entire form here, 
        // only remove the uploaded file reference
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      setUploadError('Failed to delete file');
    }
  };

  const calculateAge = (dateOfBirth: string): number => {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  const handleSubmit = async () => {
    if (!user) {
      alert('User not authenticated');
      return;
    }

    setIsSubmitting(true);

    try {
      const age = calculateAge(studentData.dateOfBirth);
      const token = localStorage.getItem('access_token');

      // Calculate averages for each assessment tool and determine enrollment status
      const processedAssessmentDetails: { [key: string]: { items: { [key: string]: number }, average: number } } = {};
      let hasClinicalSnapshotScores = false;
      let hasNonSnapshotScores = false;

      Object.entries(studentData.assessmentDetails).forEach(([toolId, toolData]) => {
        if (!toolData) return;

        const cleanedItems: { [key: string]: number } = {};
        Object.entries(toolData).forEach(([itemId, score]) => {
          if (score !== null && score !== undefined) {
            cleanedItems[itemId] = score;
          }
        });

        const itemScores = Object.values(cleanedItems);
        if (itemScores.length === 0) {
          return;
        }

        if (toolId === 'clinical-snapshots') {
          hasClinicalSnapshotScores = true;
        } else {
          hasNonSnapshotScores = true;
        }

        const average = itemScores.reduce((sum, score) => sum + score, 0) / itemScores.length;
        processedAssessmentDetails[toolId] = {
          items: cleanedItems,
          average: Math.round(average * 100) / 100
        };
      });

      const priorDiagnosis = !!studentData.priorDiagnosis;
      const enrollmentStatus = priorDiagnosis
        ? (hasClinicalSnapshotScores || hasNonSnapshotScores ? 'active' : 'assessment_due')
        : (hasNonSnapshotScores ? 'active' : 'assessment_due');

      const response = await fetch(`${API_BASE_URL}/api/enroll-student`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          dateOfBirth: studentData.dateOfBirth,
          diagnosis: studentData.diagnosis,
          medicalDiagnosis: studentData.medicalDiagnosis,
          driveUrl: studentData.driveUrl,
          priorDiagnosis: !!studentData.priorDiagnosis,
          profileInfo: skipProfile ? undefined : studentData.profileInfo,
          age: age,
          goals: studentData.goals,
          therapistId: parseInt(user.id),
          // Include file information if uploaded
          uploadedFilePath: studentData.driveUrl,
          uploadedFileName: studentData.originalFileName,
          // Include assessment data with calculated averages
          selectedAssessmentTools: studentData.selectedAssessmentTools,
          assessmentDetails: Object.keys(processedAssessmentDetails).length > 0 ? processedAssessmentDetails : null,
          status: enrollmentStatus
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to enroll student');
      }

      await response.json();
      await Promise.all([
        refreshLearners(),
        refreshTempStudents()
      ]);

      // Track activity for learner enrollment
      window.dispatchEvent(new CustomEvent('activityAdded', {
        detail: {
          message: `Enrolled new learner: ${studentData.firstName} ${studentData.lastName}`,
          type: 'learner'
        }
      }));

      onSuccess?.();

      handleClose(); // Use enhanced close handler

      // Reset form and start from beginning
      setStudentData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        diagnosis: '',
        goals: [],
        priorDiagnosis: false,
        driveUrl: undefined,
        originalFileName: undefined,
        medicalDiagnosis: {
          prenatal_and_birth_history: {
            mothers_age_at_delivery: null,
            pregnancy_illnesses_medication: '',
            length_of_pregnancy_weeks: null,
            delivery_type: '',
            difficulties_at_birth: '',
            birth_cry: '',
            birth_weight_kg: null
          },
          medical_history: {
            illnesses: {
              allergies: { has: false, age_at_onset: null, notes: '' },
              convulsions: { has: false, age_at_onset: null, notes: '' },
              head_injury: { has: false, age_at_onset: null, notes: '' },
              visual_problems: { has: false, age_at_onset: null, notes: '' },
              dental_problems: { has: false, age_at_onset: null, notes: '' },
              high_fever: { has: false, age_at_onset: null, notes: '' },
              ear_infections: { has: false, age_at_onset: null, notes: '' },
              hearing_problems: { has: false, age_at_onset: null, notes: '' }
            },
            other_health_issues: '',
            current_medication: '',
            specific_diet: '',
            vaccination_details: ''
          },
          developmental_history: {
            motor_milestones: {
              turning_over_age_months: null,
              sitting_age_months: null,
              crawling_age_months: null,
              walking_age_months: null,
              motor_coordination_difficulties: ''
            },
            speech_milestones: {
              babbling_age_months: null,
              first_word_age_months: null,
              use_of_words_age_months: null,
              combining_words_age_months: null,
              regression_observed: false
            },
            toilet_training: {
              status: '',
              mode_of_indication: ''
            }
          },
          feeding_and_oromotor_skills: {
            drinking_from_cup: false,
            eating_solid_food: false,
            using_a_spoon: false,
            difficulties: {
              sucking: false,
              swallowing: false,
              chewing: false,
              blowing: false
            },
            food_texture_sensitivity: '',
            gag_choke_issues: false,
            mealtime_behavioral_problems: '',
            mouthing_objects: '',
            drooling: ''
          },
          sleeping_pattern: '',
          behavioral_issues: {
            aggression: { reported: false, observed: false },
            anger: { reported: false, observed: false },
            abnormal_fears: { reported: false, observed: false, details: '' },
            biting: { reported: false, observed: false },
            excessive_crying: { reported: false, observed: false },
            head_banging: { reported: false, observed: false },
            temper_tantrums: { reported: false, observed: false }
          },
          sensory_and_motor_stereotypes: '',
          previous_evaluations: []
        },
        profileInfo: {
          complaint_primary: '',
          referred_by: '',
          family_information: {
            father: { name: '', age: null, education: '', occupation: '', monthly_income: null },
            mother: { name: '', age: null, education: '', occupation: '', monthly_income: null },
            family_history: {
              late_talkers: '',
              genetic_disorders: '',
              sibling_details: [],
              family_type: '',
              child_care_details: '',
              parent_child_interaction: ''
            }
          },
          language_profile: { primary_language_at_home: '', other_languages_exposed_to: [] },
          social_and_play_skills: {
            development_of_play: '',
            play_pattern: '',
            peer_interaction: ''
          },
          educational_details: {
            school_name_and_location: '',
            type_of_school: '',
            hours_of_schooling: null,
            start_age_and_current_grade: '',
            concerns_from_school: '',
            support_from_school: ''
          },
          current_status_observation: {
            eye_contact: { reported: '', observed: '' },
            attention: { reported: '', observed: '' },
            sitting_tolerance: { reported: '', observed: '' },
            compliance: { reported: '', observed: '' },
            response_to_name: { reported: '', observed: '' }
          },
          parent_observations_and_needs: ''
        },
        selectedAssessmentTools: [],
        assessmentDetails: {}
      });
      setSkipProfile(false);
      setUploadError(null);
      setOcrResult(null);
      setShowOcrSuccess(false);
      setCurrentStep(1); // Reset to first step

    } catch (error) {
      console.error('Error enrolling student:', error);
      alert('Failed to enroll student. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className={
            `enroll-modal bg-white dark:bg-slate-900 rounded-2xl w-full flex flex-col ` +
            `${currentStep === 1 ? 'max-w-3xl max-h-[85vh]' : currentStep === 5 ? 'max-w-7xl max-h-[98vh]' : 'max-w-6xl max-h-[95vh]'}`
          }
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 p-8 pb-0">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-white">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                    Enroll New Student
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    Add a new student  to your program
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-8 pb-8">

            {/* Stepper */}
            <Stepper
              initialStep={1}
              currentStep={currentStep}
              onStepChange={handleStepChange}
              onFinalStepCompleted={handleSubmit}
              backButtonText="Previous"
              nextButtonText="Next"
            >
              {/* Step 1: Basic Information & Date of Birth */}
              <Step>
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-slate-800/60 dark:to-slate-700/60 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                      Basic Information
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Let's start with the student's basic details
                    </p>
                  </div>

                  {/* File upload for auto-filling - moved to top */}
                  <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-3 mb-3">
                      <FileUp className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                      <span className="text-slate-700 dark:text-slate-300">Upload medical document (PDF/DOC/DOCX) - Optional</span>
                    </div>

                    {!studentData.driveUrl ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              setUploading(true);
                              setUploadError(null);
                              setOcrProcessing(true);
                              const token = localStorage.getItem('access_token');
                              const form = new FormData();
                              form.append('file', file);
                              const res = await fetch(`${API_BASE_URL}/api/upload-document?process_ocr=true`, {
                                method: 'POST',
                                headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
                                body: form
                              });
                              if (!res.ok) {
                                throw new Error(await res.text());
                              }
                              const data = await res.json();
                              setStudentData(prev => ({
                                ...prev,
                                driveUrl: data.filePath,  // Backend returns filePath
                                originalFileName: data.fileName
                              }));
                              // Process OCR results if available
                              if (data.ocrResult && !data.ocrResult.error) {
                                setOcrResult(data.ocrResult);
                                fillFormFromOCR(data.ocrResult);
                              } else if (data.ocrResult && data.ocrResult.error) {
                                console.warn('OCR processing had issues:', data.ocrResult.message);
                              }
                            } catch (err: any) {
                              console.error(err);
                              setUploadError('Upload failed');
                            } finally {
                              setUploading(false);
                              setOcrProcessing(false);
                            }
                          }}
                          className="block w-full text-sm text-slate-600 dark:text-slate-300 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 dark:file:bg-slate-700 file:text-slate-700 dark:file:text-slate-200 hover:file:bg-slate-200 dark:hover:file:bg-slate-600"
                        />
                        {uploading && (
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            {ocrProcessing ? 'Processing document...' : 'Uploading...'}
                          </span>
                        )}
                        {uploadError && <span className="text-sm text-red-500">{uploadError}</span>}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm text-green-700 dark:text-green-300">
                              {studentData.originalFileName || 'Document uploaded'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                // Get signed URL for viewing
                                try {
                                  const token = localStorage.getItem('access_token');
                                  const response = await fetch(`${API_BASE_URL}/api/view-file`, {
                                    method: 'POST',
                                    headers: {
                                      'Authorization': `Bearer ${token}`,
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ storage_path: studentData.driveUrl }),
                                  });
                                  if (response.ok) {
                                    const data = await response.json();
                                    window.open(data.signed_url, '_blank');
                                  }
                                } catch (error) {
                                  console.error('Error viewing file:', error);
                                }
                              }}
                              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              View
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteUploadedFile();
                              }}
                              className="text-sm text-red-600 dark:text-red-400 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          File uploaded to Supabase Storage successfully.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Prior diagnosis toggle */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <input id="priorDiagnosis" type="checkbox" className={checkboxClass} checked={!!studentData.priorDiagnosis} onChange={(e) => setStudentData(p => ({ ...p, priorDiagnosis: e.target.checked }))} />
                    <label htmlFor="priorDiagnosis" className="text-sm text-slate-700 dark:text-slate-300">Has prior diagnosis</label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative group">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={studentData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                        placeholder="Enter first name"
                      />
                      <ConditionalTooltip
                        fieldValue={studentData.firstName}
                        text="Student's first name as it appears on official documents"
                      />
                    </div>
                    <div className="relative group">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={studentData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                        placeholder="Enter last name"
                      />
                      <ConditionalTooltip
                        fieldValue={studentData.lastName}
                        text="Student's last name or family name"
                      />
                    </div>
                  </div>

                  <div className="relative group">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Date of Birth
                    </label>
                    <CustomDatePicker
                      value={studentData.dateOfBirth}
                      onChange={(date) => handleInputChange('dateOfBirth', date)}
                      placeholder="Select date of birth"
                    />
                    <ConditionalTooltip
                      fieldValue={studentData.dateOfBirth}
                      text="Student's date of birth (used to calculate age)"
                    />
                    {studentData.dateOfBirth && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                        Age: {calculateAge(studentData.dateOfBirth)} years old
                      </p>
                    )}
                  </div>
                </div>
              </Step>

              {/* Step 2: Complete Profile (optional/skippable) + Goals & Diagnosis */}
              <Step>
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-slate-800/60 dark:to-slate-700/60 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                      Complete Profile Details (Optional)
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      You can skip this step and fill it later.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-600">
                    <input
                      id="skipProfile"
                      type="checkbox"
                      className={checkboxClass}
                      checked={skipProfile}
                      onChange={(e) => setSkipProfile(e.target.checked)}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="skipProfile"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer block"
                        onClick={() => setSkipProfile(!skipProfile)}
                      >
                        Skip profile details for now
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        You can fill these details later from the student's profile
                      </p>
                    </div>
                  </div>

                  {/* Conditional Next button when skip is checked */}
                  {skipProfile && (
                    <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div>
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Profile details skipped</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">Proceed to medical information</p>
                      </div>
                      <button
                        onClick={() => handleStepChange(currentStep + 1)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Next Step →
                      </button>
                    </div>
                  )}

                  {/* Basic diagnosis and goals remain here for continuity */}
                  <div className={`${skipProfile ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="relative group">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Primary Complaint</label>
                        <input className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                          value={studentData.profileInfo.complaint_primary}
                          onChange={(e) => setStudentData(p => ({ ...p, profileInfo: { ...p.profileInfo, complaint_primary: e.target.value } }))}
                          placeholder="e.g., Delayed speech" />
                        <ConditionalTooltip
                          fieldValue={studentData.profileInfo.complaint_primary}
                          text="Primary concern or reason for seeking therapy services"
                        />
                      </div>
                      <div className="relative group">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Referred By</label>
                        <input className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                          value={studentData.profileInfo.referred_by}
                          onChange={(e) => setStudentData(p => ({ ...p, profileInfo: { ...p.profileInfo, referred_by: e.target.value } }))}
                          placeholder="Doctor/center" />
                        <ConditionalTooltip
                          fieldValue={studentData.profileInfo.referred_by}
                          text="Name of doctor, specialist, or center who referred the student"
                        />
                      </div>
                    </div>

                    {/* Family information */}
                    <div className="mt-6 mb-6 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/30">
                      <h4 className="font-semibold mb-4 text-slate-800 dark:text-white">Family Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {["father", "mother"].map((role) => (
                          <div key={role} className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/50">
                            <h5 className="font-semibold mb-4 capitalize text-slate-800 dark:text-white">{role}</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="relative group">
                                <input placeholder="Name" className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                                  value={studentData.profileInfo.family_information[role].name}
                                  onChange={(e) => setStudentData(p => ({
                                    ...p,
                                    profileInfo: {
                                      ...p.profileInfo,
                                      family_information: {
                                        ...p.profileInfo.family_information,
                                        [role]: { ...p.profileInfo.family_information[role], name: e.target.value }
                                      }
                                    }
                                  }))}
                                />
                                <ConditionalTooltip
                                  fieldValue={studentData.profileInfo.family_information[role].name}
                                  text={`Full name of the ${role}`}
                                />
                              </div>
                              <div className="relative group">
                                <input placeholder="Age" type="number" className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                                  value={studentData.profileInfo.family_information[role].age ?? ''}
                                  onChange={(e) => setStudentData(p => ({
                                    ...p,
                                    profileInfo: {
                                      ...p.profileInfo,
                                      family_information: {
                                        ...p.profileInfo.family_information,
                                        [role]: { ...p.profileInfo.family_information[role], age: e.target.value ? Number(e.target.value) : null }
                                      }
                                    }
                                  }))}
                                />
                                <ConditionalTooltip
                                  fieldValue={studentData.profileInfo.family_information[role].age}
                                  text={`Current age of the ${role} in years`}
                                />
                              </div>
                              <div className="relative group">
                                <input placeholder="Education" className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                                  value={studentData.profileInfo.family_information[role].education}
                                  onChange={(e) => setStudentData(p => ({
                                    ...p,
                                    profileInfo: {
                                      ...p.profileInfo,
                                      family_information: {
                                        ...p.profileInfo.family_information,
                                        [role]: { ...p.profileInfo.family_information[role], education: e.target.value }
                                      }
                                    }
                                  }))}
                                />
                                <ConditionalTooltip
                                  fieldValue={studentData.profileInfo.family_information[role].education}
                                  text={`Educational qualification of the ${role}`}
                                />
                              </div>
                              <div className="relative group">
                                <input placeholder="Occupation" className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                                  value={studentData.profileInfo.family_information[role].occupation}
                                  onChange={(e) => setStudentData(p => ({
                                    ...p,
                                    profileInfo: {
                                      ...p.profileInfo,
                                      family_information: {
                                        ...p.profileInfo.family_information,
                                        [role]: { ...p.profileInfo.family_information[role], occupation: e.target.value }
                                      }
                                    }
                                  }))}
                                />
                                <ConditionalTooltip
                                  fieldValue={studentData.profileInfo.family_information[role].occupation}
                                  text={`Job or profession of the ${role}`}
                                />
                              </div>
                              <div className="relative group">
                                <input placeholder="Monthly Income" type="number" className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                                  value={studentData.profileInfo.family_information[role].monthly_income ?? ''}
                                  onChange={(e) => setStudentData(p => ({
                                    ...p,
                                    profileInfo: {
                                      ...p.profileInfo,
                                      family_information: {
                                        ...p.profileInfo.family_information,
                                        [role]: { ...p.profileInfo.family_information[role], monthly_income: e.target.value ? Number(e.target.value) : null }
                                      }
                                    }
                                  }))}
                                />
                                <ConditionalTooltip
                                  fieldValue={studentData.profileInfo.family_information[role].monthly_income}
                                  text={`Monthly income of the ${role} in local currency`}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Family history */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative group">
                        <input placeholder="Late talkers" className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                          value={studentData.profileInfo.family_information.family_history.late_talkers}
                          onChange={(e) => setStudentData(p => ({ ...p, profileInfo: { ...p.profileInfo, family_information: { ...p.profileInfo.family_information, family_history: { ...p.profileInfo.family_information.family_history, late_talkers: e.target.value } } } }))}
                        />
                        <ConditionalTooltip
                          fieldValue={studentData.profileInfo.family_information.family_history.late_talkers}
                          text="Family members who had delayed speech development"
                        />
                      </div>
                      <div className="relative group">
                        <input placeholder="Genetic disorders" className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                          value={studentData.profileInfo.family_information.family_history.genetic_disorders}
                          onChange={(e) => setStudentData(p => ({ ...p, profileInfo: { ...p.profileInfo, family_information: { ...p.profileInfo.family_information, family_history: { ...p.profileInfo.family_information.family_history, genetic_disorders: e.target.value } } } }))}
                        />
                        <ConditionalTooltip
                          fieldValue={studentData.profileInfo.family_information.family_history.genetic_disorders}
                          text="Any hereditary or genetic conditions in the family"
                        />
                      </div>
                      <div className="relative group">
                        <input placeholder="Family type" className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                          value={studentData.profileInfo.family_information.family_history.family_type}
                          onChange={(e) => setStudentData(p => ({ ...p, profileInfo: { ...p.profileInfo, family_information: { ...p.profileInfo.family_information, family_history: { ...p.profileInfo.family_information.family_history, family_type: e.target.value } } } }))}
                        />
                        <ConditionalTooltip
                          fieldValue={studentData.profileInfo.family_information.family_history.family_type}
                          text="Nuclear, joint, extended family structure"
                        />
                      </div>
                      <div className="relative group">
                        <input placeholder="Child care details" className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                          value={studentData.profileInfo.family_information.family_history.child_care_details}
                          onChange={(e) => setStudentData(p => ({ ...p, profileInfo: { ...p.profileInfo, family_information: { ...p.profileInfo.family_information, family_history: { ...p.profileInfo.family_information.family_history, child_care_details: e.target.value } } } }))}
                        />
                        <ConditionalTooltip
                          fieldValue={studentData.profileInfo.family_information.family_history.child_care_details}
                          text="Who takes care of the child and daily routine"
                        />
                      </div>
                      <div className="relative group">
                        <input placeholder="Parent-child interaction" className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                          value={studentData.profileInfo.family_information.family_history.parent_child_interaction}
                          onChange={(e) => setStudentData(p => ({ ...p, profileInfo: { ...p.profileInfo, family_information: { ...p.profileInfo.family_information, family_history: { ...p.profileInfo.family_information.family_history, parent_child_interaction: e.target.value } } } }))}
                        />
                        <ConditionalTooltip
                          fieldValue={studentData.profileInfo.family_information.family_history.parent_child_interaction}
                          text="Quality and nature of relationship between parents and child"
                        />
                      </div>
                    </div>

                    {/* Diagnosis & Goals */}
                    <div className="mt-6">
                      <div className="relative group">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Diagnosis/Condition</label>
                        <textarea
                          value={studentData.diagnosis}
                          onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none"
                          placeholder="Enter diagnosis or condition details"
                        />
                        <ConditionalTooltip
                          fieldValue={studentData.diagnosis}
                          text="Current medical diagnosis, condition, or presenting concerns"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Add Goal</label>
                      <div className="flex gap-2">
                        <div className="relative group flex-1">
                          <input
                            type="text"
                            value={currentGoal}
                            onChange={(e) => setCurrentGoal(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                            className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                            placeholder="Enter a learning goal"
                          />
                          <ConditionalTooltip
                            fieldValue={currentGoal}
                            text="Specific, measurable therapy goals for the student"
                          />
                        </div>
                        <button
                          onClick={addGoal}
                          disabled={!currentGoal.trim() || studentData.goals.length >= 5}
                          className="px-4 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >Add</button>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">You can add up to 5 goals</p>
                      {studentData.goals.length > 0 && (
                        <div className="space-y-2 mt-2">
                          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Current Goals ({studentData.goals.length}/5)</h4>
                          {studentData.goals.map((goal, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <span className="text-slate-700 dark:text-slate-300">{goal}</span>
                              <button onClick={() => removeGoal(index)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Step>

              {/* Step 3: Medical Info (mandatory) + Upload document */}
              <Step>
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-slate-800/60 dark:to-slate-700/60 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Medical Information</h3>
                    <p className="text-slate-600 dark:text-slate-400">Complete the medical details below.</p>
                  </div>

                  {/* Prenatal and Birth History */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold mb-3 text-slate-800 dark:text-white">Prenatal and Birth History</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative group">
                        <input placeholder="Mother's age at delivery" type="number" className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                          value={studentData.medicalDiagnosis.prenatal_and_birth_history.mothers_age_at_delivery ?? ''}
                          onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, prenatal_and_birth_history: { ...p.medicalDiagnosis.prenatal_and_birth_history, mothers_age_at_delivery: e.target.value ? Number(e.target.value) : null } } }))}
                        />
                        <ConditionalTooltip
                          fieldValue={studentData.medicalDiagnosis.prenatal_and_birth_history.mothers_age_at_delivery}
                          text="Mother's age when the child was born"
                        />
                      </div>
                      <div className="relative group">
                        <input placeholder="Length of pregnancy (weeks)" type="number" className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                          value={studentData.medicalDiagnosis.prenatal_and_birth_history.length_of_pregnancy_weeks ?? ''}
                          onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, prenatal_and_birth_history: { ...p.medicalDiagnosis.prenatal_and_birth_history, length_of_pregnancy_weeks: e.target.value ? Number(e.target.value) : null } } }))}
                        />
                        <ConditionalTooltip
                          fieldValue={studentData.medicalDiagnosis.prenatal_and_birth_history.length_of_pregnancy_weeks}
                          text="Duration of pregnancy in weeks (normal is 37-42 weeks)"
                        />
                      </div>
                      <div className="relative group">
                        <input placeholder="Delivery type" className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                          value={studentData.medicalDiagnosis.prenatal_and_birth_history.delivery_type}
                          onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, prenatal_and_birth_history: { ...p.medicalDiagnosis.prenatal_and_birth_history, delivery_type: e.target.value } } }))}
                        />
                        <ConditionalTooltip
                          fieldValue={studentData.medicalDiagnosis.prenatal_and_birth_history.delivery_type}
                          text="Method of delivery (normal, C-section, vacuum, forceps)"
                        />
                      </div>
                      <div className="relative group">
                        <input placeholder="Birth weight (kg)" type="number" className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                          value={studentData.medicalDiagnosis.prenatal_and_birth_history.birth_weight_kg ?? ''}
                          onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, prenatal_and_birth_history: { ...p.medicalDiagnosis.prenatal_and_birth_history, birth_weight_kg: e.target.value ? Number(e.target.value) : null } } }))}
                        />
                        <ConditionalTooltip
                          fieldValue={studentData.medicalDiagnosis.prenatal_and_birth_history.birth_weight_kg}
                          text="Child's weight at birth in kilograms"
                        />
                      </div>
                      <div className="relative group">
                        <input placeholder="Pregnancy illnesses/medication" className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                          value={studentData.medicalDiagnosis.prenatal_and_birth_history.pregnancy_illnesses_medication}
                          onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, prenatal_and_birth_history: { ...p.medicalDiagnosis.prenatal_and_birth_history, pregnancy_illnesses_medication: e.target.value } } }))}
                        />
                        <ConditionalTooltip
                          fieldValue={studentData.medicalDiagnosis.prenatal_and_birth_history.pregnancy_illnesses_medication}
                          text="Any illnesses during pregnancy or medications taken"
                        />
                      </div>
                      <div className="relative group">
                        <input placeholder="Difficulties at birth" className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                          value={studentData.medicalDiagnosis.prenatal_and_birth_history.difficulties_at_birth}
                          onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, prenatal_and_birth_history: { ...p.medicalDiagnosis.prenatal_and_birth_history, difficulties_at_birth: e.target.value } } }))}
                        />
                        <ConditionalTooltip
                          fieldValue={studentData.medicalDiagnosis.prenatal_and_birth_history.difficulties_at_birth}
                          text="Any complications during labor and delivery"
                        />
                      </div>
                      <div className="relative group">
                        <input placeholder="Birth cry" className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                          value={studentData.medicalDiagnosis.prenatal_and_birth_history.birth_cry}
                          onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, prenatal_and_birth_history: { ...p.medicalDiagnosis.prenatal_and_birth_history, birth_cry: e.target.value } } }))}
                        />
                        <ConditionalTooltip
                          fieldValue={studentData.medicalDiagnosis.prenatal_and_birth_history.birth_cry}
                          text="Whether baby cried immediately after birth (yes/no/delayed)"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Medical history illnesses (booleans with details) */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold mb-3 text-slate-800 dark:text-white">Medical History - Illnesses</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.keys(studentData.medicalDiagnosis.medical_history.illnesses).map((key) => {
                        const ill = studentData.medicalDiagnosis.medical_history.illnesses[key];
                        return (
                          <div key={key} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                            <div className="flex items-center gap-2 mb-2">
                              <input type="checkbox" className={checkboxClass} checked={!!ill.has} onChange={(e) => setStudentData(p => ({
                                ...p,
                                medicalDiagnosis: { ...p.medicalDiagnosis, medical_history: { ...p.medicalDiagnosis.medical_history, illnesses: { ...p.medicalDiagnosis.medical_history.illnesses, [key]: { ...ill, has: e.target.checked } } } }
                              }))} />
                              <span className="capitalize text-sm text-slate-700 dark:text-slate-300">{key.replace('_', ' ')}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="relative group">
                                <input placeholder="Age at onset" type="number" className="w-full px-2 py-1 rounded bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                                  value={ill.age_at_onset ?? ''}
                                  onChange={(e) => setStudentData(p => ({
                                    ...p,
                                    medicalDiagnosis: { ...p.medicalDiagnosis, medical_history: { ...p.medicalDiagnosis.medical_history, illnesses: { ...p.medicalDiagnosis.medical_history.illnesses, [key]: { ...ill, age_at_onset: e.target.value ? Number(e.target.value) : null } } } }
                                  }))}
                                />
                                <ConditionalTooltip
                                  fieldValue={ill.age_at_onset}
                                  text="Age when condition first appeared"
                                />
                              </div>
                              <div className="relative group">
                                <input placeholder="Notes" className="w-full px-2 py-1 rounded bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                                  value={ill.notes}
                                  onChange={(e) => setStudentData(p => ({
                                    ...p,
                                    medicalDiagnosis: { ...p.medicalDiagnosis, medical_history: { ...p.medicalDiagnosis.medical_history, illnesses: { ...p.medicalDiagnosis.medical_history.illnesses, [key]: { ...ill, notes: e.target.value } } } }
                                  }))}
                                />
                                <ConditionalTooltip
                                  fieldValue={ill.notes}
                                  text="Additional details about this condition"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="relative group">
                        <input placeholder="Other health issues" className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" value={studentData.medicalDiagnosis.medical_history.other_health_issues}
                          onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, medical_history: { ...p.medicalDiagnosis.medical_history, other_health_issues: e.target.value } } }))} />
                        <ConditionalTooltip
                          fieldValue={studentData.medicalDiagnosis.medical_history.other_health_issues}
                          text="Any other medical conditions or health concerns"
                        />
                      </div>
                      <div className="relative group">
                        <input placeholder="Current medication" className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" value={studentData.medicalDiagnosis.medical_history.current_medication}
                          onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, medical_history: { ...p.medicalDiagnosis.medical_history, current_medication: e.target.value } } }))} />
                        <ConditionalTooltip
                          fieldValue={studentData.medicalDiagnosis.medical_history.current_medication}
                          text="Medications currently being taken"
                        />
                      </div>
                      <div className="relative group">
                        <input placeholder="Specific diet" className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" value={studentData.medicalDiagnosis.medical_history.specific_diet}
                          onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, medical_history: { ...p.medicalDiagnosis.medical_history, specific_diet: e.target.value } } }))} />
                        <ConditionalTooltip
                          fieldValue={studentData.medicalDiagnosis.medical_history.specific_diet}
                          text="Special dietary requirements or restrictions"
                        />
                      </div>
                      <div className="relative group">
                        <input placeholder="Vaccination details" className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" value={studentData.medicalDiagnosis.medical_history.vaccination_details}
                          onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, medical_history: { ...p.medicalDiagnosis.medical_history, vaccination_details: e.target.value } } }))} />
                        <ConditionalTooltip
                          fieldValue={studentData.medicalDiagnosis.medical_history.vaccination_details}
                          text="Vaccination history and immunization records"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional sections (developmental, feeding/oromotor, sleeping, behavioral, sensory, previous evaluations) */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                    <h4 className="font-semibold text-slate-800 dark:text-white">Developmental History</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative group">
                        <input placeholder="Turning over (months)" type="number" className="w-full px-3 py-2 rounded bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" value={studentData.medicalDiagnosis.developmental_history.motor_milestones.turning_over_age_months ?? ''} onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, developmental_history: { ...p.medicalDiagnosis.developmental_history, motor_milestones: { ...p.medicalDiagnosis.developmental_history.motor_milestones, turning_over_age_months: e.target.value ? Number(e.target.value) : null } } } }))} />
                        <ConditionalTooltip
                          fieldValue={studentData.medicalDiagnosis.developmental_history.motor_milestones.turning_over_age_months}
                          text="Age when child first turned over from back to front"
                        />
                      </div>
                      <div className="relative group">
                        <input placeholder="Sitting (months)" type="number" className="w-full px-3 py-2 rounded bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" value={studentData.medicalDiagnosis.developmental_history.motor_milestones.sitting_age_months ?? ''} onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, developmental_history: { ...p.medicalDiagnosis.developmental_history, motor_milestones: { ...p.medicalDiagnosis.developmental_history.motor_milestones, sitting_age_months: e.target.value ? Number(e.target.value) : null } } } }))} />
                        <ConditionalTooltip
                          fieldValue={studentData.medicalDiagnosis.developmental_history.motor_milestones.sitting_age_months}
                          text="Age when child could sit without support"
                        />
                      </div>
                      <div className="relative group">
                        <input placeholder="Crawling (months)" type="number" className="w-full px-3 py-2 rounded bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" value={studentData.medicalDiagnosis.developmental_history.motor_milestones.crawling_age_months ?? ''} onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, developmental_history: { ...p.medicalDiagnosis.developmental_history, motor_milestones: { ...p.medicalDiagnosis.developmental_history.motor_milestones, crawling_age_months: e.target.value ? Number(e.target.value) : null } } } }))} />
                        <ConditionalTooltip
                          fieldValue={studentData.medicalDiagnosis.developmental_history.motor_milestones.crawling_age_months}
                          text="Age when child started crawling on hands and knees"
                        />
                      </div>
                      <div className="relative group">
                        <input placeholder="Walking (months)" type="number" className="w-full px-3 py-2 rounded bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" value={studentData.medicalDiagnosis.developmental_history.motor_milestones.walking_age_months ?? ''} onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, developmental_history: { ...p.medicalDiagnosis.developmental_history, motor_milestones: { ...p.medicalDiagnosis.developmental_history.motor_milestones, walking_age_months: e.target.value ? Number(e.target.value) : null } } } }))} />
                        <ConditionalTooltip
                          fieldValue={studentData.medicalDiagnosis.developmental_history.motor_milestones.walking_age_months}
                          text="Age when child started walking independently"
                        />
                      </div>
                      <div className="relative group">
                        <input placeholder="Motor coordination difficulties" className="w-full px-3 py-2 rounded bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" value={studentData.medicalDiagnosis.developmental_history.motor_milestones.motor_coordination_difficulties} onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, developmental_history: { ...p.medicalDiagnosis.developmental_history, motor_milestones: { ...p.medicalDiagnosis.developmental_history.motor_milestones, motor_coordination_difficulties: e.target.value } } } }))} />
                        <ConditionalTooltip
                          fieldValue={studentData.medicalDiagnosis.developmental_history.motor_milestones.motor_coordination_difficulties}
                          text="Any difficulties with balance, coordination, or motor skills"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative group">
                        <input placeholder="Babbling (months)" type="number" className="w-full px-3 py-2 rounded bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" value={studentData.medicalDiagnosis.developmental_history.speech_milestones.babbling_age_months ?? ''} onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, developmental_history: { ...p.medicalDiagnosis.developmental_history, speech_milestones: { ...p.medicalDiagnosis.developmental_history.speech_milestones, babbling_age_months: e.target.value ? Number(e.target.value) : null } } } }))} />
                        <ConditionalTooltip
                          fieldValue={studentData.medicalDiagnosis.developmental_history.speech_milestones.babbling_age_months}
                          text="Age when child started making babbling sounds"
                        />
                      </div>
                      <div className="relative group">
                        <input placeholder="First word (months)" type="number" className="w-full px-3 py-2 rounded bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" value={studentData.medicalDiagnosis.developmental_history.speech_milestones.first_word_age_months ?? ''} onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, developmental_history: { ...p.medicalDiagnosis.developmental_history, speech_milestones: { ...p.medicalDiagnosis.developmental_history.speech_milestones, first_word_age_months: e.target.value ? Number(e.target.value) : null } } } }))} />
                        <ConditionalTooltip
                          fieldValue={studentData.medicalDiagnosis.developmental_history.speech_milestones.first_word_age_months}
                          text="Age when child spoke their first meaningful word"
                        />
                      </div>
                      <div className="relative group">
                        <input placeholder="Use of words (months)" type="number" className="w-full px-3 py-2 rounded bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" value={studentData.medicalDiagnosis.developmental_history.speech_milestones.use_of_words_age_months ?? ''} onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, developmental_history: { ...p.medicalDiagnosis.developmental_history, speech_milestones: { ...p.medicalDiagnosis.developmental_history.speech_milestones, use_of_words_age_months: e.target.value ? Number(e.target.value) : null } } } }))} />
                        <ConditionalTooltip
                          fieldValue={studentData.medicalDiagnosis.developmental_history.speech_milestones.use_of_words_age_months}
                          text="Age when child began using words meaningfully"
                        />
                      </div>
                      <div className="relative group">
                        <input placeholder="Combining words (months)" type="number" className="w-full px-3 py-2 rounded bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" value={studentData.medicalDiagnosis.developmental_history.speech_milestones.combining_words_age_months ?? ''} onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, developmental_history: { ...p.medicalDiagnosis.developmental_history, speech_milestones: { ...p.medicalDiagnosis.developmental_history.speech_milestones, combining_words_age_months: e.target.value ? Number(e.target.value) : null } } } }))} />
                        <ConditionalTooltip
                          fieldValue={studentData.medicalDiagnosis.developmental_history.speech_milestones.combining_words_age_months}
                          text="Age when child started combining 2 or more words"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input id="regressionObserved" type="checkbox" className={checkboxClass} checked={!!studentData.medicalDiagnosis.developmental_history.speech_milestones.regression_observed} onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, developmental_history: { ...p.medicalDiagnosis.developmental_history, speech_milestones: { ...p.medicalDiagnosis.developmental_history.speech_milestones, regression_observed: e.target.checked } } } }))} />
                        <label htmlFor="regressionObserved" className="text-sm text-slate-700 dark:text-slate-300">Regression observed</label>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative group">
                        <input placeholder="Toilet training status" className="w-full px-3 py-2 rounded bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" value={studentData.medicalDiagnosis.developmental_history.toilet_training.status} onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, developmental_history: { ...p.medicalDiagnosis.developmental_history, toilet_training: { ...p.medicalDiagnosis.developmental_history.toilet_training, status: e.target.value } } } }))} />
                        <ConditionalTooltip
                          fieldValue={studentData.medicalDiagnosis.developmental_history.toilet_training.status}
                          text="Current toilet training status (trained/partial/not started)"
                        />
                      </div>
                      <div className="relative group">
                        <input placeholder="Mode of indication" className="w-full px-3 py-2 rounded bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" value={studentData.medicalDiagnosis.developmental_history.toilet_training.mode_of_indication} onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, developmental_history: { ...p.medicalDiagnosis.developmental_history, toilet_training: { ...p.medicalDiagnosis.developmental_history.toilet_training, mode_of_indication: e.target.value } } } }))} />
                        <ConditionalTooltip
                          fieldValue={studentData.medicalDiagnosis.developmental_history.toilet_training.mode_of_indication}
                          text="How child indicates need to use bathroom"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Feeding & Oromotor */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <h4 className="font-semibold text-slate-800 dark:text-white">Feeding and Oromotor Skills</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        ['drinking_from_cup', 'Drinking from cup'],
                        ['eating_solid_food', 'Eating solid food'],
                        ['using_a_spoon', 'Using a spoon']
                      ] as const).map(([k, label]) => (
                        <label key={k} className="flex items-center gap-2">
                          <input type="checkbox" className={checkboxClass} checked={!!studentData.medicalDiagnosis.feeding_and_oromotor_skills[k]}
                            onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, feeding_and_oromotor_skills: { ...p.medicalDiagnosis.feeding_and_oromotor_skills, [k]: e.target.checked } } }))} />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                        </label>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {(['sucking', 'swallowing', 'chewing', 'blowing'] as const).map(k => (
                        <label key={k} className="flex items-center gap-2">
                          <input type="checkbox" className={checkboxClass} checked={!!studentData.medicalDiagnosis.feeding_and_oromotor_skills.difficulties[k]}
                            onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, feeding_and_oromotor_skills: { ...p.medicalDiagnosis.feeding_and_oromotor_skills, difficulties: { ...p.medicalDiagnosis.feeding_and_oromotor_skills.difficulties, [k]: e.target.checked } } } }))} />
                          <span className="text-sm text-slate-700 dark:text-slate-300">Difficulty {k}</span>
                        </label>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input placeholder="Food texture sensitivity" className="px-3 py-2 rounded bg-white/50 dark:bg-slate-800/50 border" value={studentData.medicalDiagnosis.feeding_and_oromotor_skills.food_texture_sensitivity} onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, feeding_and_oromotor_skills: { ...p.medicalDiagnosis.feeding_and_oromotor_skills, food_texture_sensitivity: e.target.value } } }))} />
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className={checkboxClass} checked={!!studentData.medicalDiagnosis.feeding_and_oromotor_skills.gag_choke_issues} onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, feeding_and_oromotor_skills: { ...p.medicalDiagnosis.feeding_and_oromotor_skills, gag_choke_issues: e.target.checked } } }))} />
                        <span className="text-sm text-slate-700 dark:text-slate-300">Gag/choke issues</span>
                      </label>
                      <input placeholder="Mealtime behavioral problems" className="px-3 py-2 rounded bg-white/50 dark:bg-slate-800/50 border" value={studentData.medicalDiagnosis.feeding_and_oromotor_skills.mealtime_behavioral_problems} onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, feeding_and_oromotor_skills: { ...p.medicalDiagnosis.feeding_and_oromotor_skills, mealtime_behavioral_problems: e.target.value } } }))} />
                      <input placeholder="Mouthing objects" className="px-3 py-2 rounded bg-white/50 dark:bg-slate-800/50 border" value={studentData.medicalDiagnosis.feeding_and_oromotor_skills.mouthing_objects} onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, feeding_and_oromotor_skills: { ...p.medicalDiagnosis.feeding_and_oromotor_skills, mouthing_objects: e.target.value } } }))} />
                      <input placeholder="Drooling" className="px-3 py-2 rounded bg-white/50 dark:bg-slate-800/50 border" value={studentData.medicalDiagnosis.feeding_and_oromotor_skills.drooling} onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, feeding_and_oromotor_skills: { ...p.medicalDiagnosis.feeding_and_oromotor_skills, drooling: e.target.value } } }))} />
                    </div>
                  </div>

                  {/* Sleeping pattern */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="relative group">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Sleeping pattern</label>
                      <textarea rows={2} className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all" value={studentData.medicalDiagnosis.sleeping_pattern} onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, sleeping_pattern: e.target.value } }))}
                        placeholder="Describe sleep routine, duration, difficulties"
                      />
                      <ConditionalTooltip
                        fieldValue={studentData.medicalDiagnosis.sleeping_pattern}
                        text="Current sleep patterns, bedtime routine, duration, and any sleep difficulties"
                      />
                    </div>
                  </div>

                  {/* Behavioral issues */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                    <h4 className="font-semibold text-slate-800 dark:text-white">Behavioral Issues</h4>
                    {Object.entries(studentData.medicalDiagnosis.behavioral_issues).map(([k, v]: any) => (
                      <div key={k} className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                          <span className="capitalize text-sm font-medium text-slate-700 dark:text-slate-300">{k.replace('_', ' ')}</span>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" className={checkboxClass} checked={v.reported} onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, behavioral_issues: { ...p.medicalDiagnosis.behavioral_issues, [k]: { ...v, reported: e.target.checked } } } }))} />
                            <span className="text-sm">Reported</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" className={checkboxClass} checked={v.observed} onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, behavioral_issues: { ...p.medicalDiagnosis.behavioral_issues, [k]: { ...v, observed: e.target.checked } } } }))} />
                            <span className="text-sm">Observed</span>
                          </label>
                        </div>
                        {'details' in v && (
                          <div className="ml-4">
                            <textarea
                              placeholder={`Details for ${k.replace('_', ' ')}`}
                              className="w-full px-3 py-2 rounded bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none min-h-[40px]"
                              value={v.details || ''}
                              onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, behavioral_issues: { ...p.medicalDiagnosis.behavioral_issues, [k]: { ...v, details: e.target.value } } } }))}
                              onFocus={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = Math.max(target.scrollHeight, 100) + 'px';
                              }}
                              onBlur={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                if (!target.value.trim()) {
                                  target.style.height = '40px';
                                }
                              }}
                              onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = target.scrollHeight + 'px';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Sensory and stereotypes */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="relative group">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Sensory and Motor Stereotypes</label>
                      <textarea rows={2} className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all" value={studentData.medicalDiagnosis.sensory_and_motor_stereotypes} onChange={(e) => setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, sensory_and_motor_stereotypes: e.target.value } }))}
                        placeholder="Repetitive behaviors, sensory sensitivities, motor patterns"
                      />
                      <ConditionalTooltip
                        fieldValue={studentData.medicalDiagnosis.sensory_and_motor_stereotypes}
                        text="Repetitive behaviors, sensory sensitivities, stimming, or unusual motor patterns"
                      />
                    </div>
                  </div>

                  {/* Previous evaluations */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold mb-3 text-slate-800 dark:text-white">Previous Evaluations</h4>
                    {studentData.medicalDiagnosis.previous_evaluations.map((ev: any, idx: number) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <div className="relative group">
                          <input placeholder="Date (YYYY-MM-DD)" className="w-full px-3 py-2 rounded bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" value={ev.date} onChange={(e) => {
                            const arr = [...studentData.medicalDiagnosis.previous_evaluations];
                            arr[idx] = { ...ev, date: e.target.value };
                            setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, previous_evaluations: arr } }));
                          }} />
                          <ConditionalTooltip
                            fieldValue={ev.date}
                            text="Date when the evaluation was conducted"
                          />
                        </div>
                        <div className="relative group">
                          <input placeholder="Evaluation by" className="w-full px-3 py-2 rounded bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" value={ev.evaluation_by} onChange={(e) => {
                            const arr = [...studentData.medicalDiagnosis.previous_evaluations];
                            arr[idx] = { ...ev, evaluation_by: e.target.value };
                            setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, previous_evaluations: arr } }));
                          }} />
                          <ConditionalTooltip
                            fieldValue={ev.evaluation_by}
                            text="Professional who conducted the evaluation"
                          />
                        </div>
                        <div className="relative group">
                          <input placeholder="Place" className="w-full px-3 py-2 rounded bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" value={ev.place} onChange={(e) => {
                            const arr = [...studentData.medicalDiagnosis.previous_evaluations];
                            arr[idx] = { ...ev, place: e.target.value };
                            setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, previous_evaluations: arr } }));
                          }} />
                          <ConditionalTooltip
                            fieldValue={ev.place}
                            text="Institution or clinic where evaluation was done"
                          />
                        </div>
                        <div className="relative group">
                          <input placeholder="Tests administered" className="w-full px-3 py-2 rounded bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" value={ev.tests_administered} onChange={(e) => {
                            const arr = [...studentData.medicalDiagnosis.previous_evaluations];
                            arr[idx] = { ...ev, tests_administered: e.target.value };
                            setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, previous_evaluations: arr } }));
                          }} />
                          <ConditionalTooltip
                            fieldValue={ev.tests_administered}
                            text="Names of tests or assessments conducted"
                          />
                        </div>
                        <div className="relative group">
                          <input placeholder="Diagnosis" className="w-full px-3 py-2 rounded bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" value={ev.diagnosis} onChange={(e) => {
                            const arr = [...studentData.medicalDiagnosis.previous_evaluations];
                            arr[idx] = { ...ev, diagnosis: e.target.value };
                            setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, previous_evaluations: arr } }));
                          }} />
                          <ConditionalTooltip
                            fieldValue={ev.diagnosis}
                            text="Diagnosis or findings from the evaluation"
                          />
                        </div>
                        <div className="relative group">
                          <input placeholder="Recommendation" className="w-full px-3 py-2 rounded bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" value={ev.recommendation} onChange={(e) => {
                            const arr = [...studentData.medicalDiagnosis.previous_evaluations];
                            arr[idx] = { ...ev, recommendation: e.target.value };
                            setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, previous_evaluations: arr } }));
                          }} />
                          <ConditionalTooltip
                            fieldValue={ev.recommendation}
                            text="Treatment recommendations from the evaluation"
                          />
                        </div>
                      </div>
                    ))}
                    <button className="px-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700" onClick={() => {
                      setStudentData(p => ({ ...p, medicalDiagnosis: { ...p.medicalDiagnosis, previous_evaluations: [...p.medicalDiagnosis.previous_evaluations, { date: '', evaluation_by: '', place: '', tests_administered: '', diagnosis: '', recommendation: '' }] } }))
                    }}>Add Evaluation</button>
                  </div>
                </div>
              </Step>

              {/* Step 4: Assessment Tool Selection */}
              <Step>
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-slate-800/60 dark:to-slate-700/60 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ClipboardList className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                      Assessment Tools
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Select assessment tools based on the student's diagnosis
                    </p>
                  </div>

                  {studentData.priorDiagnosis ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <h4 className="font-semibold text-slate-800 dark:text-white mb-3">Available Assessment Tools</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { id: 'isaa', name: 'ISAA', description: 'Indian Scale for Assessment of Autism' },
                            { id: 'indt-adhd', name: 'INDT-ADHD', description: 'Indian Scale for ADHD' },
                            { id: 'clinical-snapshots', name: 'Clinical Snapshots', description: 'Clinical observation tool' }
                          ].map((tool) => (
                            <div key={tool.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  id={tool.id}
                                  className={checkboxClass}
                                  checked={studentData.selectedAssessmentTools.includes(tool.id)}
                                  onChange={(e) => {
                                    const selected = studentData.selectedAssessmentTools;
                                    if (e.target.checked) {
                                      setStudentData(prev => ({
                                        ...prev,
                                        selectedAssessmentTools: [...selected, tool.id]
                                      }));
                                    } else {
                                      setStudentData(prev => ({
                                        ...prev,
                                        selectedAssessmentTools: selected.filter(id => id !== tool.id)
                                      }));
                                    }
                                  }}
                                />
                                <div className="flex-1">
                                  <label htmlFor={tool.id} className="font-medium text-slate-800 dark:text-white cursor-pointer block">
                                    {tool.name}
                                  </label>
                                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                    {tool.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {studentData.selectedAssessmentTools.length === 0 && (
                        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                          <p className="text-amber-700 dark:text-amber-300 text-sm">
                            No assessment tools selected. You can finish enrollment now and capture assessments later; the learner will remain in Temporary Enrollment until a clinical snapshot or assessment is recorded.
                          </p>
                        </div>
                      )}
                      {studentData.priorDiagnosis && studentData.selectedAssessmentTools.length > 0 && !studentData.selectedAssessmentTools.includes('clinical-snapshots') && (
                        <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                          <p className="text-purple-700 dark:text-purple-300 text-sm">
                            Add a Clinical Snapshot when available so prior-diagnosis enrollments can move out of Temporary status.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <h4 className="font-semibold text-slate-800 dark:text-white mb-3">Available Assessment Tools</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { id: 'isaa', name: 'ISAA', description: 'Indian Scale for Assessment of Autism' },
                            { id: 'indt-adhd', name: 'INDT-ADHD', description: 'Indian Scale for ADHD' }
                          ].map((tool) => (
                            <div key={tool.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  id={tool.id}
                                  className={checkboxClass}
                                  checked={studentData.selectedAssessmentTools.includes(tool.id)}
                                  onChange={(e) => {
                                    const selected = studentData.selectedAssessmentTools;
                                    if (e.target.checked) {
                                      setStudentData(prev => ({
                                        ...prev,
                                        selectedAssessmentTools: [...selected, tool.id]
                                      }));
                                    } else {
                                      setStudentData(prev => ({
                                        ...prev,
                                        selectedAssessmentTools: selected.filter(id => id !== tool.id)
                                      }));
                                    }
                                  }}
                                />
                                <div className="flex-1">
                                  <label htmlFor={tool.id} className="font-medium text-slate-800 dark:text-white cursor-pointer block">
                                    {tool.name}
                                  </label>
                                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                    {tool.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {studentData.selectedAssessmentTools.length === 0 && (
                        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                          <p className="text-amber-700 dark:text-amber-300 text-sm">
                            No assessment tools selected. Completing enrollment without assessments keeps the learner in Temporary Enrollment until scores are added.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Step>

              {/* Step 5: Assessment Scoring */}
              <Step>
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-slate-800/60 dark:to-slate-700/60 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                      Assessment Scoring
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Score each assessment item individually
                    </p>
                  </div>

                  {studentData.selectedAssessmentTools.length > 0 && !hasRecordedAssessmentScores && (
                    <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <p className="text-amber-700 dark:text-amber-300 text-sm">
                        Scores are still pending. Completing enrollment without scores keeps the learner in Temporary Enrollment until assessments are captured.
                      </p>
                    </div>
                  )}

                  {studentData.selectedAssessmentTools.length > 0 ? (
                    studentData.selectedAssessmentTools.length === 1 ? (
                      // Single tool - show directly
                      (() => {
                        const toolId = studentData.selectedAssessmentTools[0];
                        const toolData = assessmentItems[toolId as keyof typeof assessmentItems];
                        if (!toolData) return null;

                        const scoredItems = Object.keys(studentData.assessmentDetails[toolId] || {}).length;
                        const totalItems = toolData.items.length;
                        const completion = Math.round((scoredItems / totalItems) * 100);

                        return (
                          <div className="space-y-6">
                            {/* Tool header with progress on same line */}
                            <div className="flex items-center justify-between p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                              <h4 className="font-semibold text-slate-800 dark:text-white text-lg">{toolData.name}</h4>
                              <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {scoredItems}/{totalItems} items ({completion}%)
                                </span>
                                <div className="w-32 bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                                  <div
                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${completion}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>

                            {/* Assessment items */}
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                              {toolData.items.map((item, index) => {
                                const itemId = `${toolId}_${index}`;
                                const currentScore = studentData.assessmentDetails[toolId]?.[itemId] ?? null;

                                return (
                                  <div key={itemId} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                    <div className="flex-1 pr-4">
                                      <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                                        {index + 1}. {item}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-slate-500 dark:text-slate-400">Score:</span>
                                      <select
                                        className="px-3 py-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm min-w-[140px]"
                                        value={currentScore ?? ''}
                                        onChange={(e) => {
                                          const score = e.target.value === '' ? null : parseInt(e.target.value);
                                          setStudentData(prev => ({
                                            ...prev,
                                            assessmentDetails: {
                                              ...prev.assessmentDetails,
                                              [toolId]: {
                                                ...prev.assessmentDetails[toolId],
                                                ...(score !== null ? { [itemId]: score } : (() => {
                                                  const { [itemId]: _, ...rest } = prev.assessmentDetails[toolId] || {};
                                                  return rest;
                                                })())
                                              }
                                            }
                                          }));
                                        }}
                                      >
                                        <option value="">Not scored</option>
                                        <option value={0}>0 - Not observed</option>
                                        <option value={1}>1 - Rarely observed</option>
                                        <option value={2}>2 - Sometimes observed</option>
                                        <option value={3}>3 - Often observed</option>
                                        <option value={4}>4 - Frequently observed</option>
                                        <option value={5}>5 - Always observed</option>
                                      </select>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      // Multiple tools - use sub-stepper
                      <div className="space-y-6">
                        {/* Sub-stepper navigation */}
                        <div className="flex items-center justify-center gap-2 mb-6">
                          {studentData.selectedAssessmentTools.map((toolId, index) => {
                            const toolData = assessmentItems[toolId as keyof typeof assessmentItems];
                            const isActive = currentAssessmentIndex === index;
                            const scoredItems = Object.keys(studentData.assessmentDetails[toolId] || {}).length;
                            const totalItems = toolData?.items.length || 0;
                            const completion = totalItems > 0 ? Math.round((scoredItems / totalItems) * 100) : 0;

                            return (
                              <button
                                key={toolId}
                                onClick={() => setCurrentAssessmentIndex(index)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${isActive
                                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                                  }`}
                              >
                                <span className="text-sm font-medium">{toolData?.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs">{scoredItems}/{totalItems}</span>
                                  <div className="w-16 bg-slate-200 dark:bg-slate-600 rounded-full h-1.5">
                                    <div
                                      className={`h-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-indigo-600' : 'bg-slate-400 dark:bg-slate-500'
                                        }`}
                                      style={{ width: `${completion}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Current tool content */}
                        {(() => {
                          const toolId = studentData.selectedAssessmentTools[currentAssessmentIndex];
                          const toolData = assessmentItems[toolId as keyof typeof assessmentItems];
                          if (!toolData) return null;

                          const scoredItems = Object.keys(studentData.assessmentDetails[toolId] || {}).length;
                          const totalItems = toolData.items.length;
                          const completion = Math.round((scoredItems / totalItems) * 100);

                          return (
                            <div className="space-y-6">
                              {/* Tool header with progress on same line */}
                              <div className="flex items-center justify-between p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                <h4 className="font-semibold text-slate-800 dark:text-white text-lg">{toolData.name}</h4>
                                <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {scoredItems}/{totalItems} items ({completion}%)
                                  </span>
                                  <div className="w-32 bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                                    <div
                                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${completion}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>

                              {/* Assessment items */}
                              <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                                {toolData.items.map((item, index) => {
                                  const itemId = `${toolId}_${index}`;
                                  const currentScore = studentData.assessmentDetails[toolId]?.[itemId] ?? null;

                                  return (
                                    <div key={itemId} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                      <div className="flex-1 pr-4">
                                        <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                                          {index + 1}. {item}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-500 dark:text-slate-400">Score:</span>
                                        <select
                                          className="px-3 py-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm min-w-[140px]"
                                          value={currentScore ?? ''}
                                          onChange={(e) => {
                                            const score = e.target.value === '' ? null : parseInt(e.target.value);
                                            setStudentData(prev => ({
                                              ...prev,
                                              assessmentDetails: {
                                                ...prev.assessmentDetails,
                                                [toolId]: {
                                                  ...prev.assessmentDetails[toolId],
                                                  ...(score !== null ? { [itemId]: score } : (() => {
                                                    const { [itemId]: _, ...rest } = prev.assessmentDetails[toolId] || {};
                                                    return rest;
                                                  })())
                                                }
                                              }
                                            }));
                                          }}
                                        >
                                          <option value="">Not scored</option>
                                          <option value={0}>0 - Not observed</option>
                                          <option value={1}>1 - Rarely observed</option>
                                          <option value={2}>2 - Sometimes observed</option>
                                          <option value={3}>3 - Often observed</option>
                                          <option value={4}>4 - Frequently observed</option>
                                          <option value={5}>5 - Always observed</option>
                                        </select>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Navigation buttons */}
                              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                                <button
                                  onClick={() => setCurrentAssessmentIndex(Math.max(0, currentAssessmentIndex - 1))}
                                  disabled={currentAssessmentIndex === 0}
                                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  ← Previous Tool
                                </button>

                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                  Tool {currentAssessmentIndex + 1} of {studentData.selectedAssessmentTools.length}
                                </span>

                                <button
                                  onClick={() => setCurrentAssessmentIndex(Math.min(studentData.selectedAssessmentTools.length - 1, currentAssessmentIndex + 1))}
                                  disabled={currentAssessmentIndex === studentData.selectedAssessmentTools.length - 1}
                                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  Next Tool →
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )
                  ) : (
                    <div className="p-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-center">
                      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Info className="h-6 w-6 text-slate-500 dark:text-slate-400" />
                      </div>
                      <h4 className="font-semibold text-slate-800 dark:text-white mb-2">No Tools Selected</h4>
                      <p className="text-slate-600 dark:text-slate-400">
                        You can finish enrollment now; the learner will remain in Temporary Enrollment until assessments are recorded.
                      </p>
                    </div>
                  )}
                </div>
              </Step>
            </Stepper>
          </div>

          {isSubmitting && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">Enrolling student...</p>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
