import connectDB from '@/lib/mongodb';
import { FollowUpSequence, FollowUpExecution } from '@/models/FollowUp';
import Proposal from '@/models/Proposal';
import Client from '@/models/Client';
import User from '@/models/User';
import sgMail from '@sendgrid/mail';

interface EmailTemplateVariables {
  client_name: string;
  proposal_title: string;
  company_name: string;
  sender_name: string;
  proposal_url?: string;
  days_since_sent: number;
  [key: string]: any;
}

export class FollowUpService {
  /**
   * Process pending follow-ups that are due for execution
   */
  static async processPendingFollowUps(): Promise<void> {
    try {
      await connectDB();

      const now = new Date();

      // Find all executions that are due for processing
      const dueExecutions = await FollowUpExecution.find({
        status: 'ACTIVE',
        nextExecutionAt: { $lte: now },
      })
        .populate({
          path: 'proposalId',
          populate: {
            path: 'clientId userId',
            select: 'name email company firstName lastName',
          },
        })
        .populate('sequenceId');

      console.log(`Processing ${dueExecutions.length} due follow-ups`);

      for (const execution of dueExecutions) {
        await this.executeFollowUpStep(execution);
      }
    } catch (error) {
      console.error('Error processing pending follow-ups:', error);
    }
  }

  /**
   * Execute a single follow-up step
   */
  static async executeFollowUpStep(execution: any): Promise<void> {
    try {
      const proposal = execution.proposalId;
      const sequence = execution.sequenceId;

      // Check stop conditions first
      if (await this.shouldStopSequence(proposal, execution)) {
        await this.stopSequence(execution, 'PROPOSAL_ACCEPTED');
        return;
      }

      // Get current step
      const currentStep = sequence.steps.find(
        (step: any) => step.stepNumber === execution.currentStep
      );

      if (!currentStep) {
        console.error(`No step found for execution ${execution._id}, step ${execution.currentStep}`);
        return;
      }

      // Send follow-up email
      const emailSent = await this.sendFollowUpEmail(
        proposal,
        currentStep,
        execution
      );

      // Log execution
      execution.executionLog.push({
        stepNumber: execution.currentStep,
        executedAt: new Date(),
        emailSent,
        recipientEmail: proposal.clientId?.email || proposal.clientInfo?.email,
        subject: currentStep.emailTemplate.subject,
        status: emailSent ? 'SENT' : 'FAILED',
      });

      // Check if this was the last step
      const isLastStep = execution.currentStep >= sequence.steps.length;

      if (isLastStep) {
        // Mark as completed
        execution.status = 'COMPLETED';
        execution.stoppedReason = 'SEQUENCE_COMPLETED';
        execution.stoppedAt = new Date();
      } else {
        // Move to next step
        execution.currentStep += 1;
        const nextStep = sequence.steps.find(
          (step: any) => step.stepNumber === execution.currentStep
        );

        if (nextStep) {
          const nextExecutionAt = new Date();
          nextExecutionAt.setDate(nextExecutionAt.getDate() + nextStep.delayDays);
          execution.nextExecutionAt = nextExecutionAt;
        }
      }

      await execution.save();

      // Check for escalation
      if (sequence.escalation?.enabled) {
        await this.checkEscalation(execution, sequence);
      }

    } catch (error) {
      console.error(`Error executing follow-up step for ${execution._id}:`, error);
      
      // Log failed execution
      execution.executionLog.push({
        stepNumber: execution.currentStep,
        executedAt: new Date(),
        emailSent: false,
        status: 'FAILED',
        error: error.message,
      });
      await execution.save();
    }
  }

  /**
   * Send follow-up email with template variables
   */
  static async sendFollowUpEmail(
    proposal: any,
    step: any,
    execution: any
  ): Promise<boolean> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        console.error('SendGrid API key not configured');
        return false;
      }

      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      // Get recipient email
      const recipientEmail = proposal.clientId?.email || proposal.clientInfo?.email;
      if (!recipientEmail) {
        console.error('No recipient email found for proposal', proposal._id);
        return false;
      }

      // Get sender information
      const sender = proposal.userId;
      const senderEmail = process.env.SENDGRID_FROM_EMAIL || sender?.email;

      // Prepare template variables
      const variables: EmailTemplateVariables = {
        client_name: proposal.clientId?.name || proposal.clientInfo?.name || 'there',
        proposal_title: proposal.title,
        company_name: proposal.clientId?.company || proposal.clientInfo?.company || 'your company',
        sender_name: sender ? `${sender.firstName} ${sender.lastName}` : 'Team',
        proposal_url: `${process.env.NEXT_PUBLIC_APP_URL}/public/proposals/${proposal.publicId}`,
        days_since_sent: Math.floor(
          (new Date().getTime() - new Date(proposal.sentAt).getTime()) / (1000 * 60 * 60 * 24)
        ),
      };

      // Replace template variables in subject and body
      const subject = this.replaceTemplateVariables(step.emailTemplate.subject, variables);
      const body = this.replaceTemplateVariables(step.emailTemplate.body, variables);

      const msg = {
        to: recipientEmail,
        from: {
          email: senderEmail,
          name: variables.sender_name,
        },
        subject,
        html: body,
        // Add custom headers for tracking
        customArgs: {
          proposalId: proposal._id.toString(),
          executionId: execution._id.toString(),
          stepNumber: step.stepNumber.toString(),
        },
      };

      const [response] = await sgMail.send(msg);
      
      console.log(`Follow-up email sent: ${response.statusCode} for proposal ${proposal._id}`);
      return true;

    } catch (error) {
      console.error('Error sending follow-up email:', error);
      return false;
    }
  }

  /**
   * Replace template variables in text
   */
  static replaceTemplateVariables(text: string, variables: EmailTemplateVariables): string {
    let result = text;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
      result = result.replace(regex, String(value));
    });

    return result;
  }

  /**
   * Check if sequence should be stopped based on conditions
   */
  static async shouldStopSequence(proposal: any, execution: any): Promise<boolean> {
    // Check if proposal status changed to accepted/rejected
    if (['ACCEPTED', 'REJECTED'].includes(proposal.status)) {
      return true;
    }

    // Check if client has responded (new send history entries after execution started)
    if (proposal.sendHistory && proposal.sendHistory.length > 0) {
      const lastSend = proposal.sendHistory[proposal.sendHistory.length - 1];
      if (lastSend.sentAt > execution.createdAt) {
        return true;
      }
    }

    return false;
  }

  /**
   * Stop a follow-up sequence
   */
  static async stopSequence(execution: any, reason: string): Promise<void> {
    execution.status = 'STOPPED';
    execution.stoppedReason = reason;
    execution.stoppedAt = new Date();
    await execution.save();

    console.log(`Follow-up sequence stopped for proposal ${execution.proposalId}: ${reason}`);
  }

  /**
   * Check and handle escalation
   */
  static async checkEscalation(execution: any, sequence: any): Promise<void> {
    if (!sequence.escalation?.enabled) {
      return;
    }

    const daysSinceStart = Math.floor(
      (new Date().getTime() - execution.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceStart >= sequence.escalation.afterDays) {
      // Send escalation email
      await this.sendEscalationEmail(execution, sequence);
    }
  }

  /**
   * Send escalation email to team members
   */
  static async sendEscalationEmail(execution: any, sequence: any): Promise<void> {
    try {
      if (!process.env.SENDGRID_API_KEY || !sequence.escalation?.escalateTo?.length) {
        return;
      }

      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const proposal = execution.proposalId;
      const clientName = proposal.clientId?.name || proposal.clientInfo?.name;

      for (const escalationTarget of sequence.escalation.escalateTo) {
        const msg = {
          to: escalationTarget.email,
          from: process.env.SENDGRID_FROM_EMAIL!,
          subject: `Follow-up Escalation: ${proposal.title}`,
          html: `
            <h3>Follow-up Escalation Required</h3>
            <p>The follow-up sequence for <strong>${proposal.title}</strong> sent to <strong>${clientName}</strong> requires your attention.</p>
            <p><strong>Days since sent:</strong> ${Math.floor((new Date().getTime() - new Date(proposal.sentAt).getTime()) / (1000 * 60 * 60 * 24))}</p>
            <p><strong>Current status:</strong> ${proposal.status}</p>
            <p><strong>Message:</strong> ${sequence.escalation.escalationMessage || 'No response received despite follow-up attempts.'}</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/proposals/${proposal._id}" style="background: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Proposal</a></p>
          `,
        };

        await sgMail.send(msg);
      }

      console.log(`Escalation email sent for proposal ${proposal._id}`);
    } catch (error) {
      console.error('Error sending escalation email:', error);
    }
  }

  /**
   * Auto-trigger follow-ups for newly sent proposals
   */
  static async autoTriggerForProposal(proposalId: string): Promise<void> {
    try {
      await connectDB();

      const proposal = await Proposal.findById(proposalId).populate('organizationId');
      if (!proposal || !['SENT', 'VIEWED'].includes(proposal.status)) {
        return;
      }

      // Get default follow-up sequence for the organization
      const defaultSequence = await FollowUpSequence.findOne({
        organizationId: proposal.organizationId,
        isDefault: true,
        isActive: true,
      });

      if (!defaultSequence) {
        console.log(`No default follow-up sequence found for organization ${proposal.organizationId}`);
        return;
      }

      // Check trigger conditions
      if (!this.matchesTriggerConditions(proposal, defaultSequence.triggerConditions)) {
        console.log(`Proposal ${proposalId} doesn't match trigger conditions`);
        return;
      }

      // Check if follow-up is already active
      const existingExecution = await FollowUpExecution.findOne({
        proposalId,
        status: 'ACTIVE',
      });

      if (existingExecution) {
        console.log(`Follow-up already active for proposal ${proposalId}`);
        return;
      }

      // Create follow-up execution
      const firstStep = defaultSequence.steps.find((step: any) => step.stepNumber === 1);
      if (!firstStep) {
        console.error(`No first step found in sequence ${defaultSequence._id}`);
        return;
      }

      const nextExecutionAt = new Date();
      nextExecutionAt.setDate(nextExecutionAt.getDate() + firstStep.delayDays);

      await FollowUpExecution.create({
        proposalId,
        sequenceId: defaultSequence._id,
        organizationId: proposal.organizationId,
        status: 'ACTIVE',
        currentStep: 1,
        nextExecutionAt,
      });

      console.log(`Auto-triggered follow-up for proposal ${proposalId}`);

    } catch (error) {
      console.error('Error auto-triggering follow-up:', error);
    }
  }

  /**
   * Check if proposal matches trigger conditions
   */
  static matchesTriggerConditions(proposal: any, conditions: any): boolean {
    // Check proposal status
    if (!conditions.proposalStatuses.includes(proposal.status)) {
      return false;
    }

    // Check proposal value if specified
    if (conditions.proposalValue) {
      const value = proposal.totalValue || 0;
      if (conditions.proposalValue.min && value < conditions.proposalValue.min) {
        return false;
      }
      if (conditions.proposalValue.max && value > conditions.proposalValue.max) {
        return false;
      }
    }

    // Check client type if specified
    if (conditions.clientType && proposal.clientId) {
      if (proposal.clientId.status !== conditions.clientType) {
        return false;
      }
    }

    return true;
  }
}