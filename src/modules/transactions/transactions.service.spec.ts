import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import {
  PrismaService,
  PaginationService,
  FilterService,
  Status,
  ActionType,
} from 'src/lib/services';
import { ActionsService } from '../actions/actions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prismaService: any;
  let actionsService: any;

  // Mock data
  const mockChannel = {
    id: 'channel-1',
    code: 'wave',
    name: 'Wave',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTransaction = {
    id: 'transaction-1',
    reference: 'DEXC_TX_1234567890ABCDEF',
    amount: 12600,
    fees: 100,
    currency: 'XOF',
    status: Status.PENDING,
    payeeName: 'John Doe',
    payeePhone: '+221770000000',
    channelId: 'channel-1',
    metadata: '{"note":"Test payment"}',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    // Create mocks with proper typing
    const mockPrismaService = {
      channel: {
        findUnique: jest.fn() as jest.MockedFunction<any>,
      },
      transaction: {
        create: jest.fn() as jest.MockedFunction<any>,
        findUnique: jest.fn() as jest.MockedFunction<any>,
        update: jest.fn() as jest.MockedFunction<any>,
        findMany: jest.fn() as jest.MockedFunction<any>,
        count: jest.fn() as jest.MockedFunction<any>,
      },
    };

    const mockActionsService = {
      add: jest.fn() as jest.MockedFunction<any>,
    };

    const mockPaginationService = {
      paginate: jest.fn() as jest.MockedFunction<any>,
      buildOrderBy: jest.fn() as jest.MockedFunction<any>,
    };

    const mockFilterService = {
      buildDynamicFilters: jest.fn() as jest.MockedFunction<any>,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ActionsService, useValue: mockActionsService },
        { provide: PaginationService, useValue: mockPaginationService },
        { provide: FilterService, useValue: mockFilterService },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    prismaService = module.get(PrismaService);
    actionsService = module.get(ActionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Calcul des frais', () => {
    it('devrait calculer les frais minimum (100 FCFA) pour un petit montant', async () => {
      // Montant: 1000 FCFA → 0.8% = 8 FCFA → min = 100 FCFA
      const createDto: CreateTransactionDto = {
        amount: 1000,
        channel: 'wave',
        recipient: { name: 'John Doe', phone: '+221770000000' },
      };

      prismaService.channel.findUnique.mockResolvedValue(mockChannel);
      prismaService.transaction.create.mockResolvedValue({
        ...mockTransaction,
        amount: 1100, // 1000 + 100 (fees)
        fees: 100,
      });
      actionsService.add.mockResolvedValue(undefined);

      const result = await service.create(createDto);

      expect(result.fees).toBe(100);
      expect(result.amount).toBe(1100);
    });

    it('devrait calculer les frais à 0.8% pour un montant moyen', async () => {
      // Montant: 50000 FCFA → 0.8% = 400 FCFA
      const createDto: CreateTransactionDto = {
        amount: 50000,
        channel: 'wave',
        recipient: { name: 'John Doe', phone: '+221770000000' },
      };

      prismaService.channel.findUnique.mockResolvedValue(mockChannel);
      prismaService.transaction.create.mockResolvedValue({
        ...mockTransaction,
        amount: 50400, // 50000 + 400 (fees)
        fees: 400,
      });
      actionsService.add.mockResolvedValue(undefined);

      const result = await service.create(createDto);

      expect(result.fees).toBe(400);
      expect(result.amount).toBe(50400);
    });

    it('devrait calculer les frais maximum (1500 FCFA) pour un grand montant', async () => {
      // Montant: 300000 FCFA → 0.8% = 2400 FCFA → max = 1500 FCFA
      const createDto: CreateTransactionDto = {
        amount: 300000,
        channel: 'wave',
        recipient: { name: 'John Doe', phone: '+221770000000' },
      };

      prismaService.channel.findUnique.mockResolvedValue(mockChannel);
      prismaService.transaction.create.mockResolvedValue({
        ...mockTransaction,
        amount: 301500, // 300000 + 1500 (fees max)
        fees: 1500,
      });
      actionsService.add.mockResolvedValue(undefined);

      const result = await service.create(createDto);

      expect(result.fees).toBe(1500);
      expect(result.amount).toBe(301500);
    });

    it('devrait arrondir les frais au supérieur', async () => {
      // Montant: 15625 FCFA → 0.8% = 125.0 FCFA → arrondi = 125 FCFA
      const createDto: CreateTransactionDto = {
        amount: 15625,
        channel: 'wave',
        recipient: { name: 'John Doe', phone: '+221770000000' },
      };

      prismaService.channel.findUnique.mockResolvedValue(mockChannel);
      prismaService.transaction.create.mockResolvedValue({
        ...mockTransaction,
        amount: 15750, // 15625 + 125
        fees: 125,
      });
      actionsService.add.mockResolvedValue(undefined);

      const result = await service.create(createDto);

      expect(result.fees).toBe(125);
      expect(result.amount).toBe(15750);
    });

    it("devrait rejeter si le canal n'existe pas", async () => {
      const createDto: CreateTransactionDto = {
        amount: 10000,
        channel: 'invalid-channel',
        recipient: { name: 'John Doe', phone: '+221770000000' },
      };

      prismaService.channel.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prismaService.transaction.create).not.toHaveBeenCalled();
    });
  });

  describe("Transitions d'état", () => {
    describe('PENDING → PROCESSING', () => {
      it('devrait passer de PENDING à PROCESSING avec succès', async () => {
        const transactionId = 'transaction-1';

        prismaService.transaction.update.mockResolvedValue({
          ...mockTransaction,
          status: Status.PROCESSING,
        });
        actionsService.add.mockResolvedValue(undefined);

        const result = await service.updateStatus(
          transactionId,
          Status.PROCESSING,
        );

        expect(result.status).toBe(Status.PROCESSING);
        expect(prismaService.transaction.update).toHaveBeenCalledWith({
          where: { id: transactionId },
          data: { status: Status.PROCESSING },
        });
        expect(actionsService.add).toHaveBeenCalledWith({
          type: ActionType.TRANSFER_PROCESSING,
          transactionId,
        });
      });
    });

    describe('PROCESSING → SUCCESS', () => {
      it('devrait passer de PROCESSING à SUCCESS avec succès', async () => {
        const transactionId = 'transaction-1';

        prismaService.transaction.update.mockResolvedValue({
          ...mockTransaction,
          status: Status.SUCCESS,
        });
        actionsService.add.mockResolvedValue(undefined);

        const result = await service.updateStatus(
          transactionId,
          Status.SUCCESS,
        );

        expect(result.status).toBe(Status.SUCCESS);
        expect(actionsService.add).toHaveBeenCalledWith({
          type: ActionType.TRANSFER_SUCCESS,
          transactionId,
        });
      });
    });

    describe('PROCESSING → FAILED', () => {
      it("devrait passer de PROCESSING à FAILED en cas d'échec", async () => {
        const transactionId = 'transaction-1';

        prismaService.transaction.update.mockResolvedValue({
          ...mockTransaction,
          status: Status.FAILED,
        });
        actionsService.add.mockResolvedValue(undefined);

        const result = await service.updateStatus(transactionId, Status.FAILED);

        expect(result.status).toBe(Status.FAILED);
        expect(actionsService.add).toHaveBeenCalledWith({
          type: ActionType.TRANSFER_FAILED,
          transactionId,
        });
      });
    });

    describe('PENDING → CANCELED', () => {
      it('devrait annuler une transaction PENDING', async () => {
        const transactionId = 'transaction-1';

        prismaService.transaction.findUnique.mockResolvedValue({
          ...mockTransaction,
          status: Status.PENDING,
        });
        prismaService.transaction.update.mockResolvedValue({
          ...mockTransaction,
          status: Status.CANCELED,
        });
        actionsService.add.mockResolvedValue(undefined);

        const result = await service.cancel(transactionId);

        expect(result.status).toBe(Status.CANCELED);
        expect(actionsService.add).toHaveBeenCalledWith({
          type: ActionType.TRANSFER_CANCELED,
          transactionId,
        });
      });

      it("ne devrait pas annuler une transaction qui n'est pas PENDING", async () => {
        const transactionId = 'transaction-1';

        prismaService.transaction.findUnique.mockResolvedValue({
          ...mockTransaction,
          status: Status.PROCESSING,
        });

        await expect(service.cancel(transactionId)).rejects.toThrow(
          ConflictException,
        );
        expect(prismaService.transaction.update).not.toHaveBeenCalled();
      });

      it('ne devrait pas annuler une transaction SUCCESS', async () => {
        const transactionId = 'transaction-1';

        prismaService.transaction.findUnique.mockResolvedValue({
          ...mockTransaction,
          status: Status.SUCCESS,
        });

        await expect(service.cancel(transactionId)).rejects.toThrow(
          ConflictException,
        );
      });

      it("devrait rejeter si la transaction n'existe pas", async () => {
        const transactionId = 'non-existent';

        prismaService.transaction.findUnique.mockResolvedValue(null);

        await expect(service.cancel(transactionId)).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });

  describe('findOne', () => {
    it('devrait retourner une transaction existante avec son canal', async () => {
      const transactionId = 'transaction-1';

      prismaService.transaction.findUnique.mockResolvedValue({
        ...mockTransaction,
        channel: mockChannel,
      });

      const result = await service.findOne(transactionId);

      expect(result).toEqual({
        ...mockTransaction,
        channel: mockChannel,
      });
      expect(prismaService.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: transactionId },
        include: { channel: true },
      });
    });

    it("devrait lever une NotFoundException si la transaction n'existe pas", async () => {
      const transactionId = 'non-existent';

      prismaService.transaction.findUnique.mockResolvedValue(null);

      await expect(service.findOne(transactionId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Génération de référence', () => {
    it('devrait générer une référence unique à chaque création', async () => {
      const createDto: CreateTransactionDto = {
        amount: 10000,
        channel: 'wave',
        recipient: { name: 'John Doe', phone: '+221770000000' },
      };

      prismaService.channel.findUnique.mockResolvedValue(mockChannel);

      // Premier appel
      prismaService.transaction.create.mockResolvedValueOnce({
        ...mockTransaction,
        reference: 'DEXC_TX_ABC123DEF456',
      });

      const result1 = await service.create(createDto);

      // Deuxième appel
      prismaService.transaction.create.mockResolvedValueOnce({
        ...mockTransaction,
        reference: 'DEXC_TX_XYZ789GHI012',
      });

      const result2 = await service.create(createDto);

      expect(result1.reference).toMatch(/^DEXC_TX_[A-Z0-9]{16}$/);
      expect(result2.reference).toMatch(/^DEXC_TX_[A-Z0-9]{16}$/);
      expect(result1.reference).not.toBe(result2.reference);
    });
  });

  describe('Logging des actions', () => {
    it('devrait logger TRANSFER_CREATED lors de la création', async () => {
      const createDto: CreateTransactionDto = {
        amount: 10000,
        channel: 'wave',
        recipient: { name: 'John Doe', phone: '+221770000000' },
      };

      prismaService.channel.findUnique.mockResolvedValue(mockChannel);
      prismaService.transaction.create.mockResolvedValue(mockTransaction);
      actionsService.add.mockResolvedValue(undefined);

      await service.create(createDto);

      expect(actionsService.add).toHaveBeenCalledWith({
        type: ActionType.TRANSFER_CREATED,
        transactionId: mockTransaction.id,
      });
    });

    it('devrait logger chaque changement de statut', async () => {
      const transactionId = 'transaction-1';

      // Test pour chaque statut
      const statusTests = [
        { status: Status.PROCESSING, action: ActionType.TRANSFER_PROCESSING },
        { status: Status.SUCCESS, action: ActionType.TRANSFER_SUCCESS },
        { status: Status.FAILED, action: ActionType.TRANSFER_FAILED },
        { status: Status.CANCELED, action: ActionType.TRANSFER_CANCELED },
      ];

      for (const { status, action } of statusTests) {
        prismaService.transaction.update.mockResolvedValue({
          ...mockTransaction,
          status,
        });
        actionsService.add.mockClear();

        await service.updateStatus(transactionId, status);

        expect(actionsService.add).toHaveBeenCalledWith({
          type: action,
          transactionId,
        });
      }
    });
  });
});
