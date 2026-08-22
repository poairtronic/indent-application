const fs = require('fs');

const target = 'src/business-transaction/services/business-transaction.service.ts';
let code = fs.readFileSync(target, 'utf8');

const updateDraftSearch = `    const existing = await this.getTransactionContext(id);
    const allowedStates = [
      WorkflowState.DRAFT,
      WorkflowState.PRODUCTION_PROCESSING,
      WorkflowState.ACCOUNTS_COST_VERIFICATION,
    ];

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
              where: { isDeleted: false },
            },
          },
        },
      },
    });`;

const updateDraftReplace = `    const [existing, user] = await Promise.all([
      this.getTransactionContext(id),
      this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true },
                where: { isDeleted: false },
              },
            },
          },
        },
      }),
    ]);
    const allowedStates = [
      WorkflowState.DRAFT,
      WorkflowState.PRODUCTION_PROCESSING,
      WorkflowState.ACCOUNTS_COST_VERIFICATION,
    ];`;

code = code.replace(updateDraftSearch, updateDraftReplace);


const uploadAttachmentSearch = `    const txData = await this.getTransactionContext(id);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { department: true },
    });`;

const uploadAttachmentReplace = `    const [txData, user] = await Promise.all([
      this.getTransactionContext(id),
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { department: true },
      }),
    ]);`;

code = code.replace(uploadAttachmentSearch, uploadAttachmentReplace);

// Note: deleteAttachment and removeAttachmentFromIndent don't fetch user first, or fetch it separately.
// For deleteAttachment:
const deleteAttachmentSearch = `    const txData = await this.getTransactionContext(id);

    const attachment = await this.prisma.indentAttachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment || attachment.indentId !== id || attachment.isDeleted) {
      throw new NotFoundException(\`Attachment with ID '\${attachmentId}' not found.\`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { department: true },
    });`;

const deleteAttachmentReplace = `    const [txData, attachment, user] = await Promise.all([
      this.getTransactionContext(id),
      this.prisma.indentAttachment.findUnique({
        where: { id: attachmentId },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { department: true },
      }),
    ]);

    if (!attachment || attachment.indentId !== id || attachment.isDeleted) {
      throw new NotFoundException(\`Attachment with ID '\${attachmentId}' not found.\`);
    }`;
code = code.replace(deleteAttachmentSearch, deleteAttachmentReplace);

fs.writeFileSync(target, code, 'utf8');
console.log('Read parallelizations applied');
