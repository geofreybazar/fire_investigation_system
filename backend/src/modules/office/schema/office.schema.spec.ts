import { officeSchema } from './office.schema.js';

describe('officeSchema', () => {
  it('trims the name and collapses repeated spaces', () => {
    const office = officeSchema.parse({
      name: '  Quezon   City  Fire Station ',
      type: 'CITY_FIRE_STATION',
    });

    expect(office.name).toBe('Quezon City Fire Station');
  });

  it('rejects a name that is too short once trimmed', () => {
    expect(
      officeSchema.safeParse({
        name: '   NHQ   ',
        type: 'NATIONAL_HEADQUARTERS',
      }).success,
    ).toBe(false);
  });
});
