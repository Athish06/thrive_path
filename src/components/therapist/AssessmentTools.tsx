import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ArrowLeft, ChevronRight, Star, Target, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AssessmentTool {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  domains: AssessmentDomain[];
}

interface AssessmentDomain {
  id: string;
  title: string;
  description: string;
  items: AssessmentItem[];
}

interface AssessmentItem {
  id: string;
  text: string;
  awareness?: string;
  levels?: {
    level: string;
    description: string;
    meaning: string;
  }[];
}

const assessmentTools: AssessmentTool[] = [
  {
    id: 'isaa',
    title: 'ISAA (Indian Scale for Assessment of Autism)',
    description: 'A comprehensive diagnostic tool to assess the presence and severity of Autism Spectrum Disorder based on 40 specific behavioral items.',
    icon: Brain,
    color: 'violet',
    domains: [
      {
        id: 'social-relationship',
        title: 'Domain I: Social Relationship and Reciprocity',
        description: 'Assessment of social interaction and relationship building',
        items: [
          {
            id: '1',
            text: 'Has poor eye contact',
            awareness: 'Understanding different levels of eye contact behavior',
            levels: [
              { level: '1', description: 'Minimal or no eye contact during interactions', meaning: 'May indicate significant social communication challenges' },
              { level: '2', description: 'Occasional eye contact, often brief or inconsistent', meaning: 'Moderate social engagement with room for improvement' },
              { level: '3', description: 'Regular eye contact but may not be sustained', meaning: 'Developing social awareness with some natural responses' },
              { level: '4', description: 'Consistent eye contact in most situations', meaning: 'Good social engagement with occasional lapses' },
              { level: '5', description: 'Natural, sustained eye contact throughout interactions', meaning: 'Typical social communication patterns' }
            ]
          },
          {
            id: '2',
            text: 'Lacks social smile',
            awareness: 'Understanding social smiling patterns and their significance',
            levels: [
              { level: '1', description: 'Rarely smiles in response to social interactions', meaning: 'May indicate limited social reciprocity awareness' },
              { level: '2', description: 'Occasional social smiles, often delayed or forced', meaning: 'Emerging social responsiveness with support needed' },
              { level: '3', description: 'Regular social smiles but may not be contextually appropriate', meaning: 'Developing social connection skills' },
              { level: '4', description: 'Appropriate social smiles in most interactions', meaning: 'Strong social engagement with good emotional connection' },
              { level: '5', description: 'Natural, spontaneous social smiling', meaning: 'Typical emotional and social responsiveness' }
            ]
          },
          {
            id: '3',
            text: 'Remains aloof',
            awareness: 'Understanding social distance and engagement preferences',
            levels: [
              { level: '1', description: 'Severely withdrawn, avoids all social contact', meaning: 'Significant social isolation requiring intensive support' },
              { level: '2', description: 'Often prefers solitary activities over social ones', meaning: 'Moderate social withdrawal with structured support beneficial' },
              { level: '3', description: 'Participates in some social activities but prefers alone time', meaning: 'Balanced social needs with individual preferences' },
              { level: '4', description: 'Generally engaged socially with occasional need for space', meaning: 'Good social integration with healthy boundaries' },
              { level: '5', description: 'Fully engaged and comfortable in social settings', meaning: 'Typical social participation and comfort' }
            ]
          },
          {
            id: '4',
            text: 'Does not reach out to others',
            awareness: 'Understanding social initiation and connection-seeking behaviors',
            levels: [
              { level: '1', description: 'Never initiates social contact or interaction', meaning: 'May need significant support for social initiation skills' },
              { level: '2', description: 'Occasional attempts at social initiation, often unsuccessful', meaning: 'Developing social skills with guidance and practice' },
              { level: '3', description: 'Regular social initiation but may be awkward or inappropriate', meaning: 'Growing social confidence with refinement needed' },
              { level: '4', description: 'Successful social initiation in most situations', meaning: 'Strong social skills with occasional support' },
              { level: '5', description: 'Natural, confident social initiation and connection', meaning: 'Typical social engagement and relationship building' }
            ]
          },
          {
            id: '5',
            text: 'Unable to relate to people',
            awareness: 'Understanding the ability to form and maintain social relationships',
            levels: [
              { level: '1', description: 'Cannot form or maintain any social relationships', meaning: 'Requires comprehensive social skills intervention' },
              { level: '2', description: 'Limited social relationships, often superficial', meaning: 'Benefits from structured social skills training' },
              { level: '3', description: 'Some meaningful relationships but struggles with depth', meaning: 'Developing relationship skills with ongoing support' },
              { level: '4', description: 'Good social relationships with occasional challenges', meaning: 'Strong social connections with minimal support' },
              { level: '5', description: 'Forms and maintains deep, meaningful relationships naturally', meaning: 'Typical social relationship formation and maintenance' }
            ]
          },
          {
            id: '6',
            text: 'Unable to respond to social/environmental cues',
            awareness: 'Understanding awareness and response to social context and environmental signals',
            levels: [
              { level: '1', description: 'Does not respond to any social or environmental cues', meaning: 'Significant support needed for social awareness' },
              { level: '2', description: 'Responds to basic cues but misses subtle ones', meaning: 'Developing social awareness with targeted teaching' },
              { level: '3', description: 'Responds to most cues but may misinterpret some', meaning: 'Good social awareness with occasional clarification' },
              { level: '4', description: 'Accurate response to social and environmental cues', meaning: 'Strong social perception and adaptation skills' },
              { level: '5', description: 'Natural, intuitive response to all social and environmental cues', meaning: 'Typical social and environmental awareness' }
            ]
          },
          {
            id: '7',
            text: 'Engages in solitary and repetitive play activities',
            awareness: 'Understanding play preferences and social vs. solitary activity choices',
            levels: [
              { level: '1', description: 'Exclusively solitary, repetitive play; no social play', meaning: 'May benefit from structured play skills intervention' },
              { level: '2', description: 'Mostly solitary play with occasional social attempts', meaning: 'Developing social play skills with support' },
              { level: '3', description: 'Balanced solitary and social play with preferences', meaning: 'Flexible play skills with individual needs' },
              { level: '4', description: 'Primarily social play with occasional solitary activities', meaning: 'Strong social play skills with healthy alone time' },
              { level: '5', description: 'Natural engagement in varied social and cooperative play', meaning: 'Typical play development and social interaction' }
            ]
          },
          {
            id: '8',
            text: 'Unable to take turns in social interaction',
            awareness: 'Understanding turn-taking skills in social and play contexts',
            levels: [
              { level: '1', description: 'Cannot take turns or wait for others in any situation', meaning: 'Requires intensive turn-taking skills training' },
              { level: '2', description: 'Occasional turn-taking with significant prompting', meaning: 'Developing turn-taking skills with consistent support' },
              { level: '3', description: 'Regular turn-taking but may need reminders', meaning: 'Growing independence in social turn-taking' },
              { level: '4', description: 'Reliable turn-taking with occasional lapses', meaning: 'Strong turn-taking skills with minimal support' },
              { level: '5', description: 'Natural, effortless turn-taking in all social situations', meaning: 'Typical social reciprocity and cooperation' }
            ]
          },
          {
            id: '9',
            text: 'Does not maintain peer relationships',
            awareness: 'Understanding the ability to sustain friendships and peer connections over time',
            levels: [
              { level: '1', description: 'Unable to maintain any peer relationships long-term', meaning: 'Comprehensive social skills and relationship support needed' },
              { level: '2', description: 'Brief peer relationships that quickly dissolve', meaning: 'Benefits from social skills coaching and peer support' },
              { level: '3', description: 'Some sustained relationships but frequent challenges', meaning: 'Developing relationship maintenance skills' },
              { level: '4', description: 'Stable peer relationships with occasional issues', meaning: 'Strong friendship skills with periodic support' },
              { level: '5', description: 'Maintains healthy, long-term peer relationships naturally', meaning: 'Typical peer relationship development and maintenance' }
            ]
          }
        ]
      },
      {
        id: 'emotional-responsiveness',
        title: 'Domain II: Emotional Responsiveness',
        description: 'Assessment of emotional expression and response patterns',
        items: [
          {
            id: '10',
            text: 'Shows inappropriate emotional response',
            awareness: 'Understanding emotional regulation and contextually appropriate emotional responses',
            levels: [
              { level: '1', description: 'Emotions are consistently inappropriate or overwhelming', meaning: 'Significant emotional regulation support required' },
              { level: '2', description: 'Occasional inappropriate emotional responses', meaning: 'Developing emotional regulation with guidance' },
              { level: '3', description: 'Generally appropriate emotions with some mismatches', meaning: 'Good emotional awareness with occasional support' },
              { level: '4', description: 'Appropriate emotional responses in most situations', meaning: 'Strong emotional regulation skills' },
              { level: '5', description: 'Natural, contextually appropriate emotional responses', meaning: 'Typical emotional intelligence and regulation' }
            ]
          },
          {
            id: '11',
            text: 'Shows exaggerated emotions',
            awareness: 'Understanding emotional intensity and modulation',
            levels: [
              { level: '1', description: 'Emotions are severely exaggerated and unmodulated', meaning: 'Intensive emotional regulation intervention needed' },
              { level: '2', description: 'Occasional emotional exaggeration or intensity', meaning: 'Developing emotional modulation skills' },
              { level: '3', description: 'Emotions are generally proportionate with some exaggeration', meaning: 'Good emotional control with occasional intensity' },
              { level: '4', description: 'Appropriate emotional intensity in most situations', meaning: 'Strong emotional regulation and expression' },
              { level: '5', description: 'Natural, well-modulated emotional expression', meaning: 'Typical emotional range and control' }
            ]
          },
          {
            id: '12',
            text: 'Engages in self-stimulating emotions',
            awareness: 'Understanding self-soothing and emotional self-regulation strategies',
            levels: [
              { level: '1', description: 'Excessive self-stimulating behaviors for emotional regulation', meaning: 'Alternative coping strategies and emotional support needed' },
              { level: '2', description: 'Occasional use of self-stimulating behaviors for comfort', meaning: 'Developing diverse emotional regulation techniques' },
              { level: '3', description: 'Regular self-stimulation as one of several coping strategies', meaning: 'Flexible emotional regulation with healthy outlets' },
              { level: '4', description: 'Primarily uses appropriate coping strategies', meaning: 'Strong emotional regulation with minimal self-stimulation' },
              { level: '5', description: 'Natural emotional regulation without self-stimulating behaviors', meaning: 'Typical emotional coping and self-regulation' }
            ]
          },
          {
            id: '13',
            text: 'Lacks fear of danger',
            awareness: 'Understanding safety awareness and risk perception',
            levels: [
              { level: '1', description: 'No awareness of danger or safety concerns', meaning: 'Constant supervision and safety education required' },
              { level: '2', description: 'Limited safety awareness, misses many dangers', meaning: 'Structured safety training and close supervision needed' },
              { level: '3', description: 'Recognizes some dangers but not consistently', meaning: 'Developing safety awareness with ongoing teaching' },
              { level: '4', description: 'Good safety awareness with occasional lapses', meaning: 'Strong risk perception with minimal supervision' },
              { level: '5', description: 'Natural, intuitive understanding of safety and danger', meaning: 'Typical safety awareness and risk assessment' }
            ]
          },
          {
            id: '14',
            text: 'Excited or agitated for no apparent reason',
            awareness: 'Understanding emotional regulation and triggers for agitation',
            levels: [
              { level: '1', description: 'Constant unexplained agitation and excitement', meaning: 'Comprehensive emotional regulation and sensory support needed' },
              { level: '2', description: 'Occasional unexplained emotional dysregulation', meaning: 'Developing emotional triggers awareness and coping skills' },
              { level: '3', description: 'Periodic agitation with identifiable patterns', meaning: 'Good emotional awareness with trigger management' },
              { level: '4', description: 'Rare unexplained agitation, generally calm', meaning: 'Strong emotional regulation with occasional support' },
              { level: '5', description: 'Consistent emotional calm and appropriate excitement levels', meaning: 'Typical emotional stability and regulation' }
            ]
          }
        ]
      },
      {
        id: 'speech-communication',
        title: 'Domain III: Speech-Language and Communication',
        description: 'Assessment of verbal and non-verbal communication skills',
        items: [
          {
            id: '15',
            text: 'Acquired speech and lost it',
            awareness: 'Understanding speech regression and communication development patterns',
            levels: [
              { level: '1', description: 'Complete or significant speech loss after initial acquisition', meaning: 'Requires intensive speech and language intervention' },
              { level: '2', description: 'Some speech loss or significant regression periods', meaning: 'Speech therapy and communication support beneficial' },
              { level: '3', description: 'Stable speech with occasional communication challenges', meaning: 'Developing communication skills with support' },
              { level: '4', description: 'Consistent speech and communication abilities', meaning: 'Strong communication skills with minimal support' },
              { level: '5', description: 'Natural, progressive speech and language development', meaning: 'Typical communication development trajectory' }
            ]
          },
          {
            id: '16',
            text: 'Has difficulty in using non-verbal language or gestures to communicate',
            awareness: 'Understanding non-verbal communication and gesture usage',
            levels: [
              { level: '1', description: 'Cannot use any non-verbal communication effectively', meaning: 'Augmentative and alternative communication (AAC) support needed' },
              { level: '2', description: 'Limited non-verbal communication, relies heavily on verbal', meaning: 'Developing gesture and non-verbal communication skills' },
              { level: '3', description: 'Uses some non-verbal communication but inconsistently', meaning: 'Growing non-verbal communication with practice' },
              { level: '4', description: 'Effective non-verbal communication in most situations', meaning: 'Strong non-verbal skills with occasional support' },
              { level: '5', description: 'Natural, fluent use of non-verbal communication and gestures', meaning: 'Typical non-verbal communication development' }
            ]
          },
          {
            id: '17',
            text: 'Engages in stereotyped and repetitive use of language',
            awareness: 'Understanding language patterns and communicative intent',
            levels: [
              { level: '1', description: 'All language is stereotyped and repetitive, no functional communication', meaning: 'Functional communication training and AAC consideration' },
              { level: '2', description: 'Frequent repetitive language with limited functional use', meaning: 'Developing functional communication skills' },
              { level: '3', description: 'Mix of repetitive and functional language use', meaning: 'Growing communicative flexibility with support' },
              { level: '4', description: 'Primarily functional language with occasional repetition', meaning: 'Strong communication skills with minimal echolalia' },
              { level: '5', description: 'Natural, varied, and functional language use', meaning: 'Typical language development and communication' }
            ]
          },
          {
            id: '18',
            text: 'Engages in echolalic speech',
            awareness: 'Understanding echolalia and its role in communication development',
            levels: [
              { level: '1', description: 'All speech is immediate or delayed echolalia', meaning: 'Functional communication system development needed' },
              { level: '2', description: 'Frequent echolalia with emerging original speech', meaning: 'Developing independent language skills' },
              { level: '3', description: 'Some echolalia mixed with original communication', meaning: 'Growing language independence with support' },
              { level: '4', description: 'Rare echolalia, primarily original speech', meaning: 'Strong independent language skills' },
              { level: '5', description: 'No echolalia, fully original and spontaneous speech', meaning: 'Typical language development and originality' }
            ]
          },
          {
            id: '19',
            text: 'Produces infantile squeals/unusual noises',
            awareness: 'Understanding vocal development and communicative vocalizations',
            levels: [
              { level: '1', description: 'Only produces unusual noises, no clear vocal communication', meaning: 'Vocal development and communication intervention needed' },
              { level: '2', description: 'Frequent unusual vocalizations with limited clear speech', meaning: 'Developing appropriate vocal communication' },
              { level: '3', description: 'Mix of unusual and appropriate vocalizations', meaning: 'Growing vocal control and appropriateness' },
              { level: '4', description: 'Primarily appropriate vocalizations with occasional unusual sounds', meaning: 'Strong vocal development and control' },
              { level: '5', description: 'Natural, age-appropriate vocalizations and speech', meaning: 'Typical vocal development and communication' }
            ]
          },
          {
            id: '20',
            text: 'Unable to initiate or sustain conversation with others',
            awareness: 'Understanding conversational skills and social communication',
            levels: [
              { level: '1', description: 'Cannot initiate or participate in any conversations', meaning: 'Comprehensive social communication intervention required' },
              { level: '2', description: 'Limited conversation initiation and maintenance', meaning: 'Developing conversational skills with structured support' },
              { level: '3', description: 'Can initiate conversations but struggles to sustain them', meaning: 'Growing conversational fluency with practice' },
              { level: '4', description: 'Successful conversation initiation and maintenance', meaning: 'Strong social communication skills' },
              { level: '5', description: 'Natural, fluent conversationalist in social situations', meaning: 'Typical social communication and conversation skills' }
            ]
          },
          {
            id: '21',
            text: 'Uses jargon or meaningless words',
            awareness: 'Understanding word choice and communicative clarity',
            levels: [
              { level: '1', description: 'Speech consists primarily of jargon and meaningless words', meaning: 'Vocabulary development and communication clarity support needed' },
              { level: '2', description: 'Frequent use of jargon with limited meaningful words', meaning: 'Developing vocabulary and word choice skills' },
              { level: '3', description: 'Some jargon mixed with meaningful communication', meaning: 'Growing communicative clarity with support' },
              { level: '4', description: 'Primarily meaningful words with occasional jargon', meaning: 'Strong vocabulary and communication clarity' },
              { level: '5', description: 'Clear, meaningful, and contextually appropriate word choice', meaning: 'Typical vocabulary development and usage' }
            ]
          },
          {
            id: '22',
            text: 'Uses pronoun reversals',
            awareness: 'Understanding pronoun usage and perspective-taking in language',
            levels: [
              { level: '1', description: 'Consistent pronoun reversals in all communication', meaning: 'Perspective-taking and pronoun skills intervention needed' },
              { level: '2', description: 'Frequent pronoun reversals despite correction', meaning: 'Developing pronoun usage and perspective skills' },
              { level: '3', description: 'Occasional pronoun reversals, improving with reminders', meaning: 'Growing pronoun accuracy with practice' },
              { level: '4', description: 'Rare pronoun reversals, generally accurate usage', meaning: 'Strong pronoun and perspective-taking skills' },
              { level: '5', description: 'Accurate, natural pronoun usage in all contexts', meaning: 'Typical pronoun development and perspective-taking' }
            ]
          },
          {
            id: '23',
            text: 'Unable to grasp pragmatics of communication (real meaning)',
            awareness: 'Understanding social communication rules and contextual meaning',
            levels: [
              { level: '1', description: 'Cannot understand social communication rules or context', meaning: 'Comprehensive social communication and pragmatics training needed' },
              { level: '2', description: 'Limited understanding of communication pragmatics', meaning: 'Developing social communication awareness and skills' },
              { level: '3', description: 'Some understanding of pragmatics but inconsistent application', meaning: 'Growing pragmatic skills with ongoing support' },
              { level: '4', description: 'Good pragmatic understanding with occasional errors', meaning: 'Strong social communication skills' },
              { level: '5', description: 'Natural understanding and use of communication pragmatics', meaning: 'Typical social communication and pragmatic development' }
            ]
          }
        ]
      },
      {
        id: 'behavior-patterns',
        title: 'Domain IV: Behavior Patterns',
        description: 'Assessment of behavioral characteristics and patterns',
        items: [
          {
            id: '24',
            text: 'Engages in stereotyped and repetitive motor mannerisms',
            awareness: 'Understanding repetitive behaviors and their functions',
            levels: [
              { level: '1', description: 'Constant, interfering repetitive motor behaviors', meaning: 'Behavioral intervention and function-based support needed' },
              { level: '2', description: 'Frequent repetitive behaviors that impact functioning', meaning: 'Developing alternative coping and self-regulation strategies' },
              { level: '3', description: 'Some repetitive behaviors, manageable with support', meaning: 'Flexible behavioral patterns with occasional intervention' },
              { level: '4', description: 'Minimal repetitive behaviors, generally adaptive', meaning: 'Strong behavioral regulation with minimal support' },
              { level: '5', description: 'No interfering repetitive motor behaviors', meaning: 'Typical behavioral development and self-regulation' }
            ]
          },
          {
            id: '25',
            text: 'Shows attachment to inanimate objects',
            awareness: 'Understanding object attachments and their significance',
            levels: [
              { level: '1', description: 'Excessive, interfering attachment to specific objects', meaning: 'Support for transitions and flexible thinking needed' },
              { level: '2', description: 'Strong object preferences that impact flexibility', meaning: 'Developing coping strategies for transitions' },
              { level: '3', description: 'Some object attachments but generally flexible', meaning: 'Good adaptability with occasional support' },
              { level: '4', description: 'Minimal object attachments, highly flexible', meaning: 'Strong adaptability and transition skills' },
              { level: '5', description: 'No interfering object attachments, fully flexible', meaning: 'Typical attachment patterns and flexibility' }
            ]
          },
          {
            id: '26',
            text: 'Shows hyperactivity/restlessness',
            awareness: 'Understanding activity levels and self-regulation',
            levels: [
              { level: '1', description: 'Constant hyperactivity that prevents participation', meaning: 'Comprehensive behavioral and sensory support needed' },
              { level: '2', description: 'Frequent restlessness impacting focus and participation', meaning: 'Developing self-regulation and coping strategies' },
              { level: '3', description: 'Periodic hyperactivity manageable with structure', meaning: 'Good self-regulation with environmental support' },
              { level: '4', description: 'Occasional restlessness, generally focused and calm', meaning: 'Strong self-regulation skills' },
              { level: '5', description: 'Appropriate activity levels and good self-regulation', meaning: 'Typical activity level and behavioral control' }
            ]
          },
          {
            id: '27',
            text: 'Exhibits aggressive behavior',
            awareness: 'Understanding behavioral regulation and emotional expression',
            levels: [
              { level: '1', description: 'Frequent aggressive behaviors towards self or others', meaning: 'Crisis intervention and behavioral support required' },
              { level: '2', description: 'Occasional aggressive behaviors requiring intervention', meaning: 'Developing emotional regulation and coping skills' },
              { level: '3', description: 'Some challenging behaviors manageable with support', meaning: 'Growing behavioral control with strategies' },
              { level: '4', description: 'Rare aggressive behaviors, generally appropriate', meaning: 'Strong behavioral regulation skills' },
              { level: '5', description: 'No aggressive behaviors, appropriate emotional expression', meaning: 'Typical behavioral development and control' }
            ]
          },
          {
            id: '28',
            text: 'Throws temper tantrums',
            awareness: 'Understanding frustration tolerance and emotional regulation',
            levels: [
              { level: '1', description: 'Frequent, intense tantrums that are difficult to manage', meaning: 'Comprehensive emotional regulation and communication support needed' },
              { level: '2', description: 'Regular tantrums requiring significant intervention', meaning: 'Developing frustration tolerance and coping strategies' },
              { level: '3', description: 'Occasional tantrums manageable with prevention strategies', meaning: 'Good emotional control with occasional support' },
              { level: '4', description: 'Rare tantrums, generally good frustration tolerance', meaning: 'Strong emotional regulation and coping skills' },
              { level: '5', description: 'No tantrums, excellent frustration tolerance and emotional control', meaning: 'Typical emotional development and regulation' }
            ]
          },
          {
            id: '29',
            text: 'Engages in self-injurious behavior',
            awareness: 'Understanding self-injury and alternative communication strategies',
            levels: [
              { level: '1', description: 'Frequent self-injurious behaviors requiring constant supervision', meaning: 'Crisis intervention and functional behavior assessment needed' },
              { level: '2', description: 'Occasional self-injury requiring monitoring and intervention', meaning: 'Developing alternative communication and coping strategies' },
              { level: '3', description: 'Some self-injurious behaviors with prevention strategies', meaning: 'Growing behavioral control with comprehensive support' },
              { level: '4', description: 'Rare self-injury, generally safe and appropriate', meaning: 'Strong behavioral regulation and safety awareness' },
              { level: '5', description: 'No self-injurious behaviors, safe and appropriate', meaning: 'Typical behavioral development and self-control' }
            ]
          },
          {
            id: '30',
            text: 'Insists on sameness',
            awareness: 'Understanding need for routine and flexibility',
            levels: [
              { level: '1', description: 'Rigid insistence on sameness prevents any changes', meaning: 'Comprehensive flexibility and transition support needed' },
              { level: '2', description: 'Strong preference for routine with difficulty adapting', meaning: 'Developing flexibility and coping with change' },
              { level: '3', description: 'Some insistence on sameness but generally adaptable', meaning: 'Good flexibility with occasional support for changes' },
              { level: '4', description: 'Minimal insistence on sameness, highly adaptable', meaning: 'Strong adaptability and flexibility skills' },
              { level: '5', description: 'No insistence on sameness, fully flexible and adaptable', meaning: 'Typical adaptability and routine flexibility' }
            ]
          }
        ]
      },
      {
        id: 'sensory-aspects',
        title: 'Domain V: Sensory Aspects',
        description: 'Assessment of sensory processing and responses',
        items: [
          {
            id: '31',
            text: 'Unusually sensitive to sensory stimuli',
            awareness: 'Understanding sensory processing and environmental sensitivities',
            levels: [
              { level: '1', description: 'Severely sensitive to all sensory input, constant distress', meaning: 'Comprehensive sensory integration and environmental support needed' },
              { level: '2', description: 'Frequently overwhelmed by sensory stimuli', meaning: 'Developing sensory regulation and coping strategies' },
              { level: '3', description: 'Some sensory sensitivities manageable with accommodations', meaning: 'Good sensory awareness with environmental support' },
              { level: '4', description: 'Occasional sensory sensitivities, generally comfortable', meaning: 'Strong sensory processing with minimal support' },
              { level: '5', description: 'Typical sensory processing and environmental comfort', meaning: 'Typical sensory development and regulation' }
            ]
          },
          {
            id: '32',
            text: 'Stares into space for long periods of time',
            awareness: 'Understanding attention patterns and focus abilities',
            levels: [
              { level: '1', description: 'Frequent, prolonged staring episodes impacting participation', meaning: 'Attention regulation and engagement support needed' },
              { level: '2', description: 'Occasional staring that affects focus and interaction', meaning: 'Developing attention maintenance and engagement skills' },
              { level: '3', description: 'Some staring episodes but generally engaged', meaning: 'Good attention control with occasional support' },
              { level: '4', description: 'Rare staring, strong attention and engagement', meaning: 'Strong attention and focus skills' },
              { level: '5', description: 'Consistent attention and engagement, no problematic staring', meaning: 'Typical attention development and maintenance' }
            ]
          },
          {
            id: '33',
            text: 'Has difficulty in tracking objects',
            awareness: 'Understanding visual tracking and attention to visual stimuli',
            levels: [
              { level: '1', description: 'Cannot track moving objects or visual stimuli', meaning: 'Visual tracking and attention intervention needed' },
              { level: '2', description: 'Limited visual tracking abilities impacting learning', meaning: 'Developing visual attention and tracking skills' },
              { level: '3', description: 'Some difficulty with complex tracking tasks', meaning: 'Good visual tracking with support for complex tasks' },
              { level: '4', description: 'Effective visual tracking with occasional challenges', meaning: 'Strong visual attention and tracking skills' },
              { level: '5', description: 'Natural, effortless visual tracking and attention', meaning: 'Typical visual development and tracking' }
            ]
          },
          {
            id: '34',
            text: 'Has unusual vision',
            awareness: 'Understanding visual perception and processing patterns',
            levels: [
              { level: '1', description: 'Severely atypical visual perception affecting all functioning', meaning: 'Comprehensive visual processing and compensatory strategy support needed' },
              { level: '2', description: 'Frequent unusual visual perceptions impacting daily activities', meaning: 'Developing visual processing and adaptation strategies' },
              { level: '3', description: 'Some unusual visual experiences but manageable', meaning: 'Good visual adaptation with occasional support' },
              { level: '4', description: 'Typical visual perception with rare anomalies', meaning: 'Strong visual processing and perception skills' },
              { level: '5', description: 'Natural, typical visual perception and processing', meaning: 'Typical visual development and perception' }
            ]
          },
          {
            id: '35',
            text: 'Insensitive to pain',
            awareness: 'Understanding pain perception and safety awareness',
            levels: [
              { level: '1', description: 'No pain response, constant risk of injury', meaning: 'Continuous supervision and safety education required' },
              { level: '2', description: 'Reduced pain sensitivity requiring close monitoring', meaning: 'Developing safety awareness and pain recognition' },
              { level: '3', description: 'Some pain insensitivity with safety concerns', meaning: 'Good safety awareness with occasional monitoring' },
              { level: '4', description: 'Typical pain sensitivity with rare lapses', meaning: 'Strong safety and pain awareness' },
              { level: '5', description: 'Normal pain perception and appropriate safety responses', meaning: 'Typical sensory development and safety awareness' }
            ]
          },
          {
            id: '36',
            text: 'Responds to objects/people unusually by smelling, touching or tasting',
            awareness: 'Understanding sensory exploration and social boundaries',
            levels: [
              { level: '1', description: 'Constant unusual sensory exploration of objects and people', meaning: 'Sensory regulation and social boundaries training needed' },
              { level: '2', description: 'Frequent unusual sensory responses to stimuli', meaning: 'Developing appropriate sensory exploration and boundaries' },
              { level: '3', description: 'Some unusual sensory responses but generally appropriate', meaning: 'Good sensory boundaries with occasional reminders' },
              { level: '4', description: 'Rare unusual sensory responses, appropriate boundaries', meaning: 'Strong sensory regulation and social awareness' },
              { level: '5', description: 'Natural, appropriate sensory responses and social boundaries', meaning: 'Typical sensory development and social appropriateness' }
            ]
          }
        ]
      },
      {
        id: 'cognitive-component',
        title: 'Domain VI: Cognitive Component',
        description: 'Assessment of cognitive functioning and abilities',
        items: [
          {
            id: '37',
            text: 'Inconsistent attention and concentration',
            awareness: 'Understanding attention regulation and focus maintenance',
            levels: [
              { level: '1', description: 'Cannot maintain attention for any task or activity', meaning: 'Comprehensive attention regulation and focus support needed' },
              { level: '2', description: 'Very limited attention span across all activities', meaning: 'Developing attention maintenance and focus strategies' },
              { level: '3', description: 'Some attention difficulties but can focus with support', meaning: 'Good attention control with environmental accommodations' },
              { level: '4', description: 'Strong attention and concentration with occasional lapses', meaning: 'Strong attention and focus skills' },
              { level: '5', description: 'Consistent, excellent attention and concentration abilities', meaning: 'Typical attention development and regulation' }
            ]
          },
          {
            id: '38',
            text: 'Shows delay in responding',
            awareness: 'Understanding processing speed and response patterns',
            levels: [
              { level: '1', description: 'Severe delays in all responses, significantly impacting participation', meaning: 'Processing support and extended response time accommodations needed' },
              { level: '2', description: 'Frequent response delays affecting communication and learning', meaning: 'Developing processing speed and response strategies' },
              { level: '3', description: 'Some response delays but generally participates appropriately', meaning: 'Good processing speed with occasional support' },
              { level: '4', description: 'Quick, appropriate responses with rare delays', meaning: 'Strong processing speed and response abilities' },
              { level: '5', description: 'Natural, immediate responses in all situations', meaning: 'Typical processing speed and response patterns' }
            ]
          },
          {
            id: '39',
            text: 'Has unusual memory of some kind',
            awareness: 'Understanding memory patterns and learning styles',
            levels: [
              { level: '1', description: 'Severely atypical memory patterns affecting all learning', meaning: 'Comprehensive memory strategy and compensatory support needed' },
              { level: '2', description: 'Unusual memory patterns impacting learning and recall', meaning: 'Developing memory strategies and learning accommodations' },
              { level: '3', description: 'Some unusual memory characteristics but generally functional', meaning: 'Good memory adaptation with occasional support' },
              { level: '4', description: 'Typical memory patterns with rare anomalies', meaning: 'Strong memory and learning abilities' },
              { level: '5', description: 'Natural, typical memory and learning patterns', meaning: 'Typical memory development and cognitive processing' }
            ]
          },
          {
            id: '40',
            text: 'Has \'savant\' ability',
            awareness: 'Understanding exceptional abilities and their implications',
            levels: [
              { level: '1', description: 'No exceptional abilities identified', meaning: 'Focus on overall development and skill building' },
              { level: '2', description: 'Emerging exceptional abilities in specific areas', meaning: 'Developing and nurturing identified strengths' },
              { level: '3', description: 'Clear exceptional abilities in one or more areas', meaning: 'Supporting exceptional development alongside other skills' },
              { level: '4', description: 'Strong exceptional abilities with practical applications', meaning: 'Maximizing exceptional potential and independence' },
              { level: '5', description: 'Remarkable savant abilities with significant real-world impact', meaning: 'Supporting exceptional abilities and quality of life' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'indt-adhd',
    title: 'INDT-ADHD (INCLEN Diagnostic Tool for ADHD)',
    description: 'A screening tool to assess for symptoms of Attention-Deficit/Hyperactivity Disorder as a potential co-occurring condition.',
    icon: Target,
    color: 'blue',
    domains: [
      {
        id: 'inattention',
        title: 'Section A1: Inattention',
        description: 'Assessment of attention and focus difficulties',
        items: [
          {
            id: '1',
            text: 'Fails to give close attention to details or makes careless mistakes.',
            awareness: 'Understanding attention to detail and task accuracy',
            levels: [
              { level: '1', description: 'Consistently overlooks details and makes frequent errors', meaning: 'May indicate significant attention regulation challenges requiring comprehensive support' },
              { level: '2', description: 'Occasional carelessness but generally attentive to details', meaning: 'Developing attention to detail with occasional support needed' },
              { level: '3', description: 'Generally careful but has periodic lapses in attention', meaning: 'Good attention to detail with strategies for sustained focus' },
              { level: '4', description: 'Strong attention to detail with rare errors', meaning: 'Excellent task accuracy and attention regulation' },
              { level: '5', description: 'Exceptional attention to detail and error-free performance', meaning: 'Outstanding attention regulation and task precision' }
            ]
          },
          {
            id: '2',
            text: 'Has difficulty concentrating while playing or doing homework.',
            awareness: 'Understanding sustained attention during tasks and activities',
            levels: [
              { level: '1', description: 'Cannot maintain focus on any task for more than brief periods', meaning: 'Significant attention regulation support and environmental modifications needed' },
              { level: '2', description: 'Struggles to concentrate on most tasks requiring mental effort', meaning: 'Developing sustained attention skills with structured support' },
              { level: '3', description: 'Can concentrate on preferred activities but struggles with challenging tasks', meaning: 'Good attention regulation with task selection and timing support' },
              { level: '4', description: 'Strong concentration abilities with occasional difficulty on complex tasks', meaning: 'Excellent sustained attention with minimal support' },
              { level: '5', description: 'Natural, effortless concentration on all tasks and activities', meaning: 'Outstanding attention regulation and focus maintenance' }
            ]
          },
          {
            id: '3',
            text: 'Has trouble paying attention when spoken to.',
            awareness: 'Understanding auditory attention and listening skills',
            levels: [
              { level: '1', description: 'Cannot attend to verbal instructions or conversations', meaning: 'Comprehensive auditory processing and attention support required' },
              { level: '2', description: 'Frequently misses verbal information despite good intent', meaning: 'Developing auditory attention with visual supports and repetition' },
              { level: '3', description: 'Generally attentive to conversations but misses occasional details', meaning: 'Good auditory attention with occasional clarification needed' },
              { level: '4', description: 'Strong listening skills with rare lapses in attention', meaning: 'Excellent auditory attention and processing abilities' },
              { level: '5', description: 'Perfect attention to all verbal communication and instructions', meaning: 'Outstanding auditory attention and listening skills' }
            ]
          },
          {
            id: '4',
            text: 'Does not follow instructions and is unable to complete work on time.',
            awareness: 'Understanding task completion and time management skills',
            levels: [
              { level: '1', description: 'Cannot follow multi-step instructions or complete any tasks', meaning: 'Intensive task initiation and completion support needed' },
              { level: '2', description: 'Struggles to follow instructions and rarely completes work', meaning: 'Developing task completion skills with step-by-step support' },
              { level: '3', description: 'Can follow simple instructions but struggles with complex tasks', meaning: 'Good task completion with task breakdown and timing support' },
              { level: '4', description: 'Strong task completion with occasional time management issues', meaning: 'Excellent task completion and time management skills' },
              { level: '5', description: 'Perfect task completion and exceptional time management', meaning: 'Outstanding task initiation, completion, and time management' }
            ]
          },
          {
            id: '5',
            text: 'Has difficulty organizing homework, getting ready for school, or putting toys back.',
            awareness: 'Understanding organization and executive functioning skills',
            levels: [
              { level: '1', description: 'Completely unable to organize any materials or activities', meaning: 'Comprehensive organizational support and visual systems required' },
              { level: '2', description: 'Significant difficulty with organization and transitions', meaning: 'Developing organizational skills with structured routines' },
              { level: '3', description: 'Some organizational ability but needs reminders and support', meaning: 'Good organization with visual supports and checklists' },
              { level: '4', description: 'Strong organizational skills with occasional lapses', meaning: 'Excellent organizational and executive functioning abilities' },
              { level: '5', description: 'Exceptional organizational skills and perfect executive functioning', meaning: 'Outstanding organization and task management capabilities' }
            ]
          },
          {
            id: '6',
            text: 'Avoids activities that require sustained mental effort.',
            awareness: 'Understanding task persistence and mental stamina',
            levels: [
              { level: '1', description: 'Refuses all challenging mental tasks and activities', meaning: 'Motivation and task engagement support needed' },
              { level: '2', description: 'Frequently avoids mentally demanding activities', meaning: 'Developing task persistence with interest-based activities' },
              { level: '3', description: 'Participates in challenging tasks but tires quickly', meaning: 'Good task persistence with breaks and rewards' },
              { level: '4', description: 'Strong mental stamina with occasional avoidance of difficult tasks', meaning: 'Excellent task persistence and mental endurance' },
              { level: '5', description: 'Natural persistence on all mental tasks regardless of difficulty', meaning: 'Outstanding mental stamina and task engagement' }
            ]
          },
          {
            id: '7',
            text: 'Loses things like books, pencils, or toys.',
            awareness: 'Understanding memory and material management skills',
            levels: [
              { level: '1', description: 'Constantly loses all personal belongings and materials', meaning: 'Comprehensive material management and memory support needed' },
              { level: '2', description: 'Frequently loses important items despite reminders', meaning: 'Developing material management with organizational systems' },
              { level: '3', description: 'Occasionally loses items but generally good material management', meaning: 'Good material management with occasional support' },
              { level: '4', description: 'Rarely loses items, strong material management skills', meaning: 'Excellent material management and memory abilities' },
              { level: '5', description: 'Perfect material management, never loses belongings', meaning: 'Outstanding organizational memory and material management' }
            ]
          },
          {
            id: '8',
            text: 'Loses concentration due to small distractions.',
            awareness: 'Understanding focus maintenance and distraction resistance',
            levels: [
              { level: '1', description: 'Constantly distracted by minimal environmental stimuli', meaning: 'Controlled environment and intensive focus support needed' },
              { level: '2', description: 'Frequently loses focus due to small distractions', meaning: 'Developing focus maintenance with environmental modifications' },
              { level: '3', description: 'Generally focused but occasionally distracted by small stimuli', meaning: 'Good focus maintenance with occasional environmental support' },
              { level: '4', description: 'Strong focus despite minor distractions', meaning: 'Excellent concentration and distraction resistance' },
              { level: '5', description: 'Perfect concentration regardless of environmental distractions', meaning: 'Outstanding focus maintenance and attention regulation' }
            ]
          },
          {
            id: '9',
            text: 'Is more forgetful in daily activities compared to other children.',
            awareness: 'Understanding working memory and daily routine memory',
            levels: [
              { level: '1', description: 'Severely forgetful, cannot remember any daily routines or tasks', meaning: 'Comprehensive memory support and visual reminder systems needed' },
              { level: '2', description: 'Frequently forgetful of daily activities and responsibilities', meaning: 'Developing memory skills with consistent reminders and routines' },
              { level: '3', description: 'Some forgetfulness but generally remembers important activities', meaning: 'Good memory with occasional reminder support' },
              { level: '4', description: 'Strong memory for daily activities with rare lapses', meaning: 'Excellent working memory and routine retention' },
              { level: '5', description: 'Perfect memory for all daily activities and routines', meaning: 'Outstanding working memory and daily activity retention' }
            ]
          }
        ]
      },
      {
        id: 'hyperactivity-impulsivity',
        title: 'Section A2: Hyperactivity-Impulsivity',
        description: 'Assessment of hyperactivity and impulsive behaviors',
        items: [
          {
            id: '10',
            text: 'Often appears restless (tapping fingers, moving hands/feet, squirming).',
            awareness: 'Understanding physical restlessness and self-regulation',
            levels: [
              { level: '1', description: 'Constant physical restlessness preventing any seated activities', meaning: 'Movement breaks and sensory regulation support needed' },
              { level: '2', description: 'Frequent restlessness requiring frequent movement breaks', meaning: 'Developing self-regulation with movement opportunities' },
              { level: '3', description: 'Some restlessness but can remain seated for short periods', meaning: 'Good self-regulation with occasional movement breaks' },
              { level: '4', description: 'Rare restlessness, strong ability to remain still when needed', meaning: 'Excellent physical self-regulation and stillness' },
              { level: '5', description: 'Perfect stillness and physical control in all situations', meaning: 'Outstanding physical self-regulation and control' }
            ]
          },
          {
            id: '11',
            text: 'Often leaves their seat in the middle of a class or meal.',
            awareness: 'Understanding seat tolerance and activity boundaries',
            levels: [
              { level: '1', description: 'Cannot remain seated for any activity or meal', meaning: 'Flexible seating and movement integration needed' },
              { level: '2', description: 'Frequently leaves seat during structured activities', meaning: 'Developing seat tolerance with preferred seating and breaks' },
              { level: '3', description: 'Generally stays seated but occasionally leaves inappropriately', meaning: 'Good seat tolerance with occasional reminders' },
              { level: '4', description: 'Strong seat tolerance with rare inappropriate leaving', meaning: 'Excellent seat tolerance and activity boundaries' },
              { level: '5', description: 'Perfect seat tolerance in all situations and activities', meaning: 'Outstanding seat tolerance and self-regulation' }
            ]
          },
          {
            id: '12',
            text: 'Often runs about or climbs excessively in inappropriate places.',
            awareness: 'Understanding activity level regulation and safety awareness',
            levels: [
              { level: '1', description: 'Constant unsafe running and climbing in all environments', meaning: 'Safety supervision and activity redirection required' },
              { level: '2', description: 'Frequent inappropriate running and climbing behaviors', meaning: 'Developing activity regulation and safety awareness' },
              { level: '3', description: 'Some excessive activity but generally safe and appropriate', meaning: 'Good activity regulation with occasional supervision' },
              { level: '4', description: 'Appropriate activity levels with rare unsafe behaviors', meaning: 'Excellent activity regulation and safety awareness' },
              { level: '5', description: 'Perfect activity regulation and safety in all environments', meaning: 'Outstanding activity control and safety awareness' }
            ]
          },
          {
            id: '13',
            text: 'Is unable to engage in play quietly.',
            awareness: 'Understanding quiet activity participation and volume control',
            levels: [
              { level: '1', description: 'Cannot participate in any quiet activities or play', meaning: 'Sensory and activity regulation support needed' },
              { level: '2', description: 'Struggles to engage in quiet play or activities', meaning: 'Developing quiet activity skills with sensory support' },
              { level: '3', description: 'Can engage in quiet activities but tires quickly', meaning: 'Good quiet activity tolerance with occasional support' },
              { level: '4', description: 'Strong quiet activity participation with rare disruptions', meaning: 'Excellent quiet activity engagement and volume control' },
              { level: '5', description: 'Perfect quiet activity participation and volume regulation', meaning: 'Outstanding quiet activity engagement and self-control' }
            ]
          },
          {
            id: '14',
            text: 'Is running around most of the time, as if "driven by a motor."',
            awareness: 'Understanding activity drive and energy regulation',
            levels: [
              { level: '1', description: 'Constant high-energy activity preventing any calm engagement', meaning: 'Energy regulation and calming strategies required' },
              { level: '2', description: 'Frequent high-energy periods requiring constant redirection', meaning: 'Developing energy regulation with structured activities' },
              { level: '3', description: 'Some high-energy periods but can engage in calm activities', meaning: 'Good energy regulation with activity balance' },
              { level: '4', description: 'Appropriate energy levels with rare high-drive periods', meaning: 'Excellent energy regulation and activity balance' },
              { level: '5', description: 'Perfect energy regulation and calm engagement in all situations', meaning: 'Outstanding energy control and activity regulation' }
            ]
          },
          {
            id: '15',
            text: 'Often talks excessively.',
            awareness: 'Understanding verbal regulation and conversational boundaries',
            levels: [
              { level: '1', description: 'Constant talking preventing others from participating', meaning: 'Communication regulation and turn-taking support needed' },
              { level: '2', description: 'Frequent excessive talking in most situations', meaning: 'Developing verbal regulation with communication strategies' },
              { level: '3', description: 'Talks more than peers but can be redirected', meaning: 'Good verbal regulation with occasional reminders' },
              { level: '4', description: 'Appropriate talking levels with rare excessive periods', meaning: 'Excellent verbal regulation and conversational balance' },
              { level: '5', description: 'Perfect verbal regulation and conversational appropriateness', meaning: 'Outstanding verbal control and social communication' }
            ]
          },
          {
            id: '16',
            text: 'Often starts answering questions before the question has been completed.',
            awareness: 'Understanding listening completion and response timing',
            levels: [
              { level: '1', description: 'Always interrupts before questions are complete', meaning: 'Listening completion and patience training needed' },
              { level: '2', description: 'Frequently interrupts incomplete questions or statements', meaning: 'Developing listening completion with visual cues' },
              { level: '3', description: 'Occasionally interrupts but generally waits appropriately', meaning: 'Good listening completion with occasional reminders' },
              { level: '4', description: 'Rare interruptions, strong listening and response timing', meaning: 'Excellent listening completion and response timing' },
              { level: '5', description: 'Perfect listening completion and response timing', meaning: 'Outstanding listening skills and conversational patience' }
            ]
          },
          {
            id: '17',
            text: 'Has difficulty waiting for their turn in group activities.',
            awareness: 'Understanding turn-taking and group participation skills',
            levels: [
              { level: '1', description: 'Cannot wait for turns in any group activities', meaning: 'Turn-taking skills and patience training required' },
              { level: '2', description: 'Struggles to wait for turns in most group situations', meaning: 'Developing turn-taking with visual timers and supports' },
              { level: '3', description: 'Generally waits for turns but occasionally interrupts', meaning: 'Good turn-taking with occasional reminders' },
              { level: '4', description: 'Strong turn-taking skills with rare difficulties', meaning: 'Excellent turn-taking and group participation' },
              { level: '5', description: 'Perfect turn-taking and group activity participation', meaning: 'Outstanding turn-taking and social group skills' }
            ]
          },
          {
            id: '18',
            text: 'Frequently interrupts others\' conversations or games.',
            awareness: 'Understanding social boundaries and conversational etiquette',
            levels: [
              { level: '1', description: 'Constantly interrupts all conversations and activities', meaning: 'Social boundaries and communication etiquette training needed' },
              { level: '2', description: 'Frequently interrupts others despite social cues', meaning: 'Developing social awareness with direct teaching' },
              { level: '3', description: 'Some interruptions but generally respects others\' turns', meaning: 'Good social boundaries with occasional reminders' },
              { level: '4', description: 'Rare interruptions, strong social and conversational respect', meaning: 'Excellent social boundaries and conversational etiquette' },
              { level: '5', description: 'Perfect respect for others\' conversations and activities', meaning: 'Outstanding social awareness and conversational respect' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'clinical-snapshot',
    title: 'Clinical Snapshot (Short Reassessment)',
    description: 'A brief, targeted tool for validating a previous diagnosis or for conducting regular progress checks on a child\'s key skills across multiple domains.',
    icon: Activity,
    color: 'emerald',
    domains: [
      {
        id: 'social-communication',
        title: 'Domain: Social Communication & Reciprocity',
        description: 'Assessment of social interaction and communication skills',
        items: [
          {
            id: '1',
            text: 'Responds to Name',
            awareness: 'Understanding name recognition and response to personal address',
            levels: [
              { level: '0 (No response)', description: 'Does not respond to name being called', meaning: 'May indicate significant hearing concerns or social unawareness requiring evaluation' },
              { level: '1 (Responds inconsistently)', description: 'Occasional response to name, often misses calls', meaning: 'Developing name recognition with auditory training and visual supports' },
              { level: '2 (Responds consistently)', description: 'Reliable response to name in most situations', meaning: 'Good name recognition and social awareness with typical development' }
            ]
          },
          {
            id: '2',
            text: 'Joint Attention',
            awareness: 'Understanding shared attention and social referencing skills',
            levels: [
              { level: '0 (Does not look)', description: 'Does not follow pointing or share attention to objects', meaning: 'Joint attention intervention and social communication support needed' },
              { level: '1 (Looks at your hand)', description: 'Follows pointing gesture but focuses on hand rather than object', meaning: 'Developing joint attention with visual supports and modeling' },
              { level: '2 (Looks at object)', description: 'Follows pointing to look at the referenced object', meaning: 'Strong joint attention and social referencing skills' }
            ]
          },
          {
            id: '3',
            text: 'Turn-Taking',
            awareness: 'Understanding reciprocal social interaction and cooperation',
            levels: [
              { level: '0 (Does not participate)', description: 'Does not engage in back-and-forth social activities', meaning: 'Turn-taking skills training and social interaction support required' },
              { level: '1 (Participates but doesn\'t wait)', description: 'Engages in activity but does not wait for turns', meaning: 'Developing turn-taking with visual timers and social stories' },
              { level: '2 (Takes turns)', description: 'Successfully participates in reciprocal turn-taking activities', meaning: 'Excellent turn-taking and social reciprocity skills' }
            ]
          }
        ]
      },
      {
        id: 'language-cognitive',
        title: 'Domain: Language & Cognitive Skills',
        description: 'Assessment of language development and cognitive abilities',
        items: [
          {
            id: '4',
            text: 'Following Instructions',
            awareness: 'Understanding comprehension and sequential task completion',
            levels: [
              { level: '0 (Does not follow command)', description: 'Cannot follow multi-step instructions', meaning: 'Instruction comprehension support and task breakdown needed' },
              { level: '1 (Completes one step)', description: 'Follows single-step instructions but struggles with sequences', meaning: 'Developing sequential processing with visual supports' },
              { level: '2 (Completes both steps)', description: 'Successfully follows two-step instructions', meaning: 'Strong instruction comprehension and sequential processing' }
            ]
          },
          {
            id: '5',
            text: 'Expressive Labeling',
            awareness: 'Understanding verbal expression and vocabulary usage',
            levels: [
              { level: '0 (No response)', description: 'Does not attempt to label or name objects verbally', meaning: 'Augmentative communication and expressive language support needed' },
              { level: '1 (Makes a related sound)', description: 'Uses sounds or approximations but not clear words', meaning: 'Developing expressive language with speech therapy support' },
              { level: '2 (Names object)', description: 'Clearly names and labels objects verbally', meaning: 'Strong expressive language and vocabulary skills' }
            ]
          }
        ]
      },
      {
        id: 'behavior-regulation',
        title: 'Domain: Behavior & Regulation',
        description: 'Assessment of behavioral control and self-regulation',
        items: [
          {
            id: '6',
            text: 'Sitting Tolerance',
            awareness: 'Understanding sustained attention and behavioral regulation during seated activities',
            levels: [
              { level: '0 (< 1 minute)', description: 'Cannot remain seated for structured activities', meaning: 'Sensory regulation and behavioral support for seated engagement needed' },
              { level: '1 (1-3 minutes)', description: 'Can remain seated for short periods with support', meaning: 'Developing sitting tolerance with movement breaks and sensory supports' },
              { level: '2 (> 3 minutes)', description: 'Successfully engages in seated activities for extended periods', meaning: 'Excellent sitting tolerance and behavioral regulation' }
            ]
          },
          {
            id: '7',
            text: 'Response to "No"',
            awareness: 'Understanding frustration tolerance and compliance with boundaries',
            levels: [
              { level: '0 (Major tantrum/aggression)', description: 'Severe behavioral reaction to denied requests', meaning: 'Emotional regulation and coping strategies training required' },
              { level: '1 (Protests but complies)', description: 'Shows frustration but eventually complies with boundaries', meaning: 'Developing frustration tolerance with emotional support' },
              { level: '2 (Complies)', description: 'Accepts "no" and complies without major behavioral outburst', meaning: 'Strong frustration tolerance and behavioral regulation' }
            ]
          }
        ]
      }
    ]
  }
];

const AssessmentTools: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<AssessmentTool | null>(null);
  const [currentDomainIndex, setCurrentDomainIndex] = useState(0);

  const handleToolSelect = (tool: AssessmentTool) => {
    setSelectedTool(tool);
    setCurrentDomainIndex(0);
  };

  const handleBackToTools = () => {
    setSelectedTool(null);
    setCurrentDomainIndex(0);
  };

  const handleNextDomain = () => {
    if (selectedTool && currentDomainIndex < selectedTool.domains.length - 1) {
      setCurrentDomainIndex(currentDomainIndex + 1);
    }
  };

  const handlePrevDomain = () => {
    if (currentDomainIndex > 0) {
      setCurrentDomainIndex(currentDomainIndex - 1);
    }
  };

  const currentDomain = selectedTool?.domains[currentDomainIndex];

  return (
    <div className="min-h-screen relative overflow-hidden bg-white dark:bg-black">
      {/* Floating orbs background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-10 h-32 w-32 rounded-full bg-gradient-to-br from-violet-400/20 to-blue-400/20 blur-2xl"
        />
        <motion.div
          animate={{
            x: [0, -25, 0],
            y: [0, 15, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-20 left-20 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 blur-2xl"
        />
        <motion.div
          animate={{
            x: [0, 20, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-1/2 left-1/3 h-20 w-20 rounded-full bg-gradient-to-br from-pink-400/20 to-rose-400/20 blur-2xl"
        />
      </div>

      <div className="relative z-10 space-y-8 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            {selectedTool && (
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBackToTools}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
              </motion.button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
                {selectedTool ? selectedTool.title : 'Assessment Tools'}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {selectedTool ? selectedTool.description : 'Comprehensive assessment tools for developmental evaluation'}
              </p>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {!selectedTool ? (
            // Tools Overview
            <motion.div
              key="tools-overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {assessmentTools.map((tool, index) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  onClick={() => handleToolSelect(tool)}
                  className="glass-card rounded-2xl p-6 cursor-pointer group hover:shadow-xl transition-all duration-300 border border-slate-200/50 dark:border-slate-700/50 hover:border-violet-300 dark:hover:border-violet-600"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={cn(
                      'p-3 rounded-xl',
                      tool.color === 'violet' && 'bg-violet-100 dark:bg-violet-900/30',
                      tool.color === 'blue' && 'bg-blue-100 dark:bg-blue-900/30',
                      tool.color === 'emerald' && 'bg-emerald-100 dark:bg-emerald-900/30'
                    )}>
                      <tool.icon className={cn(
                        'h-8 w-8',
                        tool.color === 'violet' && 'text-violet-600 dark:text-violet-400',
                        tool.color === 'blue' && 'text-blue-600 dark:text-blue-400',
                        tool.color === 'emerald' && 'text-emerald-600 dark:text-emerald-400'
                      )} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {tool.domains.length} domains • {tool.domains.reduce((sum, domain) => sum + domain.items.length, 0)} items
                      </p>
                    </div>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                    {tool.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Clinical Standard</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-violet-500 transition-colors" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            // Assessment Tool Detail View
            <motion.div
              key="tool-detail"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              {/* Progress Indicator */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
                    Assessment Progress
                  </h2>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Domain {currentDomainIndex + 1} of {selectedTool.domains.length}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentDomainIndex + 1) / selectedTool.domains.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                    className={cn(
                      'h-3 rounded-full',
                      selectedTool.color === 'violet' && 'bg-gradient-to-r from-violet-500 to-violet-600',
                      selectedTool.color === 'blue' && 'bg-gradient-to-r from-blue-500 to-blue-600',
                      selectedTool.color === 'emerald' && 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                    )}
                  />
                </div>
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                  {selectedTool.domains.map((domain, index) => (
                    <button
                      key={domain.id}
                      onClick={() => setCurrentDomainIndex(index)}
                      className={cn(
                        'transition-colors hover:text-slate-800 dark:hover:text-white px-2 py-1 rounded',
                        index === currentDomainIndex && 'font-semibold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-700',
                        index <= currentDomainIndex && 'font-semibold text-slate-800 dark:text-white'
                      )}
                    >
                      {selectedTool.id === 'clinical-snapshot' ? `Domain ${index + 1}` : domain.title.split(':')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Domain */}
              {currentDomain && (
                <motion.div
                  key={currentDomain.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5 }}
                  className="glass-card rounded-2xl p-6"
                >
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                          {currentDomain.title}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                          {currentDomain.description}
                        </p>
                      </div>
                      
                      {/* Scoring Legend */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 text-sm">
                          {selectedTool?.id === 'clinical-snapshot' ? (
                            <>
                              <span className="text-slate-600 dark:text-slate-400">0 = Does not meet criteria</span>
                              <span className="text-slate-600 dark:text-slate-400">1 = Partially meets criteria</span>
                              <span className="text-slate-600 dark:text-slate-400">2 = Fully meets criteria</span>
                            </>
                          ) : (
                            <>
                              <span className="text-slate-600 dark:text-slate-400">1 = Rarely/Never</span>
                              <span className="text-slate-600 dark:text-slate-400">2 = Sometimes</span>
                              <span className="text-slate-600 dark:text-slate-400">3 = Frequently</span>
                              <span className="text-slate-600 dark:text-slate-400">4 = Mostly</span>
                              <span className="text-slate-600 dark:text-slate-400">5 = Always</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {currentDomain.items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50"
                      >
                        <div className="flex items-start gap-4">
                          <span className="flex-shrink-0 w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-sm font-bold text-slate-700 dark:text-slate-300">
                            {item.id}
                          </span>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                              {item.text}
                            </h4>
                            {item.awareness && (
                              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 italic">
                                {item.awareness}
                              </p>
                            )}
                            
                            {item.levels && (
                              <div className="space-y-3">
                                <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                  Understanding Different Levels:
                                </h5>
                                {item.levels.map((level, levelIndex) => (
                                  <motion.div
                                    key={levelIndex}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 + levelIndex * 0.02 }}
                                    className="p-4 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-600"
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className={cn(
                                        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                                        selectedTool?.color === 'violet' && 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
                                        selectedTool?.color === 'blue' && 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
                                        selectedTool?.color === 'emerald' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                                      )}>
                                        {level.level.split(' ')[0]}
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-800 dark:text-white mb-1">
                                          {level.description}
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                          <strong>Clinical Significance:</strong> {level.meaning}
                                        </p>
                                      </div>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
                    <button
                      onClick={handlePrevDomain}
                      disabled={currentDomainIndex === 0}
                      className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous Domain
                    </button>

                    <div className="text-center">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {selectedTool?.id === 'isaa' && 'Complete ISAA assessment provides diagnostic categorization (Mild/Moderate/Severe Autism)'}
                        {selectedTool?.id === 'indt-adhd' && 'INDT-ADHD helps identify potential ADHD symptoms requiring further evaluation'}
                        {selectedTool?.id === 'clinical-snapshot' && 'Clinical Snapshot provides targeted progress monitoring across key developmental areas'}
                      </p>
                    </div>

                    <button
                      onClick={handleNextDomain}
                      disabled={currentDomainIndex === selectedTool.domains.length - 1}
                      className={cn(
                        'px-6 py-3 rounded-xl font-medium transition-all',
                        selectedTool.color === 'violet' && 'bg-violet-600 hover:bg-violet-700 text-white',
                        selectedTool.color === 'blue' && 'bg-blue-600 hover:bg-blue-700 text-white',
                        selectedTool.color === 'emerald' && 'bg-emerald-600 hover:bg-emerald-700 text-white',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      {currentDomainIndex === selectedTool.domains.length - 1 ? 'Complete Assessment' : 'Next Domain'}
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AssessmentTools;