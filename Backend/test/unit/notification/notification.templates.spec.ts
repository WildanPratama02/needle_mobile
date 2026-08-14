import {
  TEMPLATES,
  TEMPLATE_VARIABLES,
  TemplateVariableError,
  resolveTemplateVariables,
} from '../../../src/modules/notification/notification.templates';

const CONFIRMATION_PAYLOAD = {
  exchangeNumber: 'EXC-20260812-000001',
  factoryName: 'Factory A',
  trolleyName: 'Trolley A-01',
  operatorName: 'Siti',
  needleType: 'DBx1 #11',
};

describe('TEMPLATE_VARIABLES', () => {
  // Docs/14 §6 body: Exchange No, Factory, Trolley, Operator, Needle Type.
  it('declares the confirmation template in the documented body order', () => {
    expect(TEMPLATE_VARIABLES[TEMPLATES.CONFIRMATION_REQUESTED]).toEqual([
      'exchangeNumber',
      'factoryName',
      'trolleyName',
      'operatorName',
      'needleType',
    ]);
  });

  it('declares the decided template', () => {
    expect(TEMPLATE_VARIABLES[TEMPLATES.CONFIRMATION_DECIDED]).toEqual([
      'exchangeNumber',
      'decision',
    ]);
  });

  it('declares the stuck template', () => {
    expect(TEMPLATE_VARIABLES[TEMPLATES.EXCHANGE_STUCK]).toEqual([
      'exchangeNumber',
      'trolleyName',
      'reason',
    ]);
  });

  it('covers every template code', () => {
    for (const code of Object.values(TEMPLATES)) {
      expect(TEMPLATE_VARIABLES[code]).toBeDefined();
    }
  });
});

describe('resolveTemplateVariables', () => {
  it('returns values in the declared order', () => {
    expect(
      resolveTemplateVariables(TEMPLATES.CONFIRMATION_REQUESTED, CONFIRMATION_PAYLOAD),
    ).toEqual(['EXC-20260812-000001', 'Factory A', 'Trolley A-01', 'Siti', 'DBx1 #11']);
  });

  // The whole point: key order in the payload must not affect the output.
  it('ignores the payload key order', () => {
    const shuffled = {
      needleType: 'DBx1 #11',
      trolleyName: 'Trolley A-01',
      exchangeNumber: 'EXC-20260812-000001',
      operatorName: 'Siti',
      factoryName: 'Factory A',
    };

    expect(resolveTemplateVariables(TEMPLATES.CONFIRMATION_REQUESTED, shuffled)).toEqual(
      resolveTemplateVariables(TEMPLATES.CONFIRMATION_REQUESTED, CONFIRMATION_PAYLOAD),
    );
  });

  it('resolves the decided template in order', () => {
    expect(
      resolveTemplateVariables(TEMPLATES.CONFIRMATION_DECIDED, {
        decision: 'APPROVED',
        exchangeNumber: 'EXC-1',
      }),
    ).toEqual(['EXC-1', 'APPROVED']);
  });

  it('resolves the stuck template in order', () => {
    expect(
      resolveTemplateVariables(TEMPLATES.EXCHANGE_STUCK, {
        reason: 'The approver rejected the confirmation.',
        exchangeNumber: 'EXC-1',
        trolleyName: 'Trolley A-01',
      }),
    ).toEqual(['EXC-1', 'Trolley A-01', 'The approver rejected the confirmation.']);
  });

  describe('missing variables', () => {
    it('throws and names what is missing', () => {
      const { operatorName: _dropped, ...incomplete } = CONFIRMATION_PAYLOAD;

      expect(() => resolveTemplateVariables(TEMPLATES.CONFIRMATION_REQUESTED, incomplete)).toThrow(
        /missing variable\(s\): operatorName/,
      );
    });

    it('names every missing variable, not just the first', () => {
      expect(() =>
        resolveTemplateVariables(TEMPLATES.CONFIRMATION_REQUESTED, {
          exchangeNumber: 'EXC-1',
        }),
      ).toThrow(/factoryName, trolleyName, operatorName, needleType/);
    });

    it('throws a TemplateVariableError', () => {
      expect(() => resolveTemplateVariables(TEMPLATES.CONFIRMATION_DECIDED, {})).toThrow(
        TemplateVariableError,
      );
    });

    it('rejects an empty payload', () => {
      expect(() => resolveTemplateVariables(TEMPLATES.EXCHANGE_STUCK, null)).toThrow(
        TemplateVariableError,
      );
    });

    // An empty string is a legitimate value; only absence is a defect.
    it('accepts an empty string as a value', () => {
      expect(
        resolveTemplateVariables(TEMPLATES.CONFIRMATION_DECIDED, {
          exchangeNumber: 'EXC-1',
          decision: '',
        }),
      ).toEqual(['EXC-1', '']);
    });
  });

  describe('extra variables', () => {
    // Meta substitutes positionally, so anything beyond the declared list would
    // shift the message. The template declares what it takes.
    it('drops keys the template does not declare', () => {
      expect(
        resolveTemplateVariables(TEMPLATES.CONFIRMATION_DECIDED, {
          exchangeNumber: 'EXC-1',
          decision: 'APPROVED',
          secret: 'should not be sent',
          phoneNumber: '+628123456789',
        }),
      ).toEqual(['EXC-1', 'APPROVED']);
    });

    it('sends exactly as many parameters as the template declares', () => {
      const resolved = resolveTemplateVariables(TEMPLATES.EXCHANGE_STUCK, {
        exchangeNumber: 'EXC-1',
        trolleyName: 'Trolley A-01',
        reason: 'stuck',
        extra: 'noise',
      });

      expect(resolved).toHaveLength(TEMPLATE_VARIABLES[TEMPLATES.EXCHANGE_STUCK].length);
    });
  });

  it('rejects an unknown template code', () => {
    expect(() => resolveTemplateVariables('NOT_A_TEMPLATE', { a: 'b' })).toThrow(
      /Unknown template code: NOT_A_TEMPLATE/,
    );
  });
});
