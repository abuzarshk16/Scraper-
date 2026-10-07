export interface Carrier {
    dotNumber: string;
    legalName: string;
    dbaName: string;
    mcNumber: string;
    /** DOT Number status (shown on top in MOTUS: e.g. 'Active', 'Inactive') */
    dotStatus: string;
    /** MC / Operating Authority status (shown on bottom in MOTUS: e.g. 'Active', 'Inactive', 'Revoked') */
    mcStatus: string;
    /** General carrier status */
    status: string;
    /** Operating Authority classification (e.g. 'Broker of Property', 'Motor Carrier') */
    operatingAuthorityType: string;
    /** Entity type (e.g. 'Motor Carrier (US/Canada)', 'Broker') */
    entityType: string;
    phone: string;
    email: string;
    officerName: string;
    officerTitle: string;
    officerPhone: string;
    officerEmail: string;
    physicalAddress: string;
    city: string;
    state: string;
    zip: string;
    mailingAddress: string;
    powerUnits: string;
    drivers: string;
    mcs150Date: string;
    mcs150Mileage: string;
    businessType: string;
    outOfService: string;
    sourceUrl: string;
    /** Full API response */
    raw?: unknown;
}