import { Carrier } from './types.js';

/**
 * Parses full carrier details from MOTUS (api/carriers/:dot) or search payload.
 * Extracts both top DOT status and bottom MC status along with all page fields.
 */
export function mapToCarrier(dot: string, data: any, sourceUrl: string): Carrier | null {
    if (!data || typeof data !== 'object') return null;

    // Direct object or wrapped
    const rec =
        data?.result?.[0] ?? data?.data?.[0] ?? data?.results?.[0] ?? data?.carriers?.[0] ??
        data?.data ?? data?.result ?? data;

    if (!rec || typeof rec !== 'object') return null;

    const dotNumber = String(
        rec?.entityDotNumber?.dotNumber ?? rec?.dotNumber ?? rec?.dot ?? rec?.usdot ?? dot
    ).trim();

    // Legal Name
    const legalName = String(
        rec?.entityName ?? rec?.entityNames?.[0]?.entityName ?? rec?.legalName ?? rec?.carrierName ?? rec?.name ?? ''
    ).trim();

    // DBA Name
    const dbaName = String(
        rec?.entityNames?.find((n: any) => n?.nameTypeId !== 'legal')?.entityName ?? rec?.dbaName ?? ''
    ).trim();

    if (!legalName && !dbaName && !rec?.entityDotNumber) return null;

    // 1. TOP STATUS: USDOT Status
    const dotStatus = String(
        rec?.entityDotNumber?.dotNumberStatus?.dotNumberStatus ??
        (rec?.outOfService ? 'Inactive' : (rec?.entityId ? 'Active' : ''))
    ).trim();

    // 2. BOTTOM STATUS: MC / Operating Authority Status & MC Number
    let mcNumber = '';
    let mcStatus = '';
    let opAuthType = '';

    const registrations = Array.isArray(rec?.entityRegistrations) ? rec.entityRegistrations : [];
    for (const reg of registrations) {
        const opAuthorities = Array.isArray(reg?.entityRegistrationOperatingAuthorities)
            ? reg.entityRegistrationOperatingAuthorities
            : [];
        for (const auth of opAuthorities) {
            const eoa = auth?.entityOperatingAuthority;
            if (eoa) {
                if (!mcNumber && eoa.docketNumber) mcNumber = String(eoa.docketNumber).trim();
                if (!mcStatus && eoa.operatingAuthorityStatus?.operatingAuthorityStatusName) {
                    mcStatus = String(eoa.operatingAuthorityStatus.operatingAuthorityStatusName).trim();
                }
                if (!opAuthType && eoa.operatingAuthorityType?.operatingAuthorityType) {
                    opAuthType = String(eoa.operatingAuthorityType.operatingAuthorityType).trim();
                }
            }
        }
    }

    if (!mcNumber) {
        mcNumber = String(rec?.mcNumber ?? rec?.filerNumber ?? rec?.mcMXNumber ?? '').trim();
    }
    if (!mcStatus && mcNumber) {
        mcStatus = rec?.legacyIdentifierStatus ?? '';
    }

    // Combined/General status
    const generalStatus = dotStatus || mcStatus || (rec?.entityId ? 'Active' : 'Inactive');

    // Entity Type
    const entityType = String(
        rec?.entityTypes?.[0]?.entityTypeTitle?.entityTypeName ??
        rec?.entityType ??
        rec?.operationClass ??
        ''
    ).trim();

    // Officer Info
    const officer = rec?.entityOfficers?.[0] ?? {};
    const officerName = [officer?.firstName, officer?.lastName].filter(Boolean).map((s: string) => s.trim()).join(' ');
    const officerTitle = String(officer?.title ?? '').trim();
    const officerPhone = String(officer?.phoneNumber ?? '').trim();
    const officerEmail = String(officer?.email ?? '').trim();

    // Phone & Email
    const phone = String(
        rec?.phoneNumbers?.[0]?.phoneNumber ?? officerPhone ?? rec?.phone ?? rec?.phoneNumber ?? ''
    ).trim();
    const email = String(
        rec?.emailAddresses?.[0]?.emailAddress ?? officerEmail ?? rec?.email ?? ''
    ).trim();

    // Locations
    const locations = Array.isArray(rec?.locations) ? rec.locations : [];
    // Physical location: addressTypeId 34878d0c-cf18-46ce-a23e-60bfcaf558db or primary
    const physLoc = locations.find((l: any) => l?.addressTypeId === '34878d0c-cf18-46ce-a23e-60bfcaf558db') ??
        locations.find((l: any) => l?.primaryAddressFlag) ??
        locations[0] ??
        rec?.location ??
        rec?.physicalAddress ??
        rec?.address ??
        {};

    // Mailing location: addressTypeId eef9bd53-0da3-4b96-b462-8e2711a009ef
    const mailLoc = locations.find((l: any) => l?.addressTypeId === 'eef9bd53-0da3-4b96-b462-8e2711a009ef') ??
        rec?.mailingAddress ??
        {};

    const physStreet = [physLoc?.addressLine1 ?? physLoc?.street, physLoc?.addressLine2 ?? physLoc?.street2]
        .filter(Boolean)
        .map((s: string) => String(s).trim())
        .join(' ');

    const mailStreet = [mailLoc?.addressLine1, mailLoc?.addressLine2]
        .filter(Boolean)
        .map((s: string) => String(s).trim())
        .join(' ');

    const mailingFull = [mailStreet, mailLoc?.city, mailLoc?.state, mailLoc?.zipCode]
        .filter(Boolean)
        .map((s: string) => String(s).trim())
        .join(', ');

    // Fleet & MCS-150 Details (carrierEntityDetail)
    const detail = rec?.carrierEntityDetail ?? {};
    const powerUnits = String(detail?.nbrPowerUnit ?? rec?.powerUnits ?? rec?.pc ?? '').trim();
    const drivers = String(detail?.driverTotal ?? rec?.drivers ?? '').trim();
    const mcs150Date = detail?.mcs150Date ? String(detail.mcs150Date).split('T')[0] : '';
    const mcs150Mileage = String(detail?.mcs150Mileage ?? '').trim();
    const businessType = String(detail?.businessType?.businessTypeName ?? '').trim();
    const outOfService = rec?.outOfService ? 'YES' : 'NO';

    return {
        dotNumber,
        legalName: legalName || (dbaName ? dbaName : `USDOT #${dotNumber}`),
        dbaName,
        mcNumber,
        dotStatus: dotStatus || 'Active',
        mcStatus: mcStatus || (mcNumber ? 'Active' : 'N/A'),
        status: generalStatus,
        operatingAuthorityType: opAuthType,
        entityType,
        phone,
        email,
        officerName,
        officerTitle,
        officerPhone,
        officerEmail,
        physicalAddress: physStreet,
        city: String(physLoc?.city ?? '').trim(),
        state: String(physLoc?.state ?? physLoc?.stateCode ?? '').trim(),
        zip: String(physLoc?.zipCode ?? physLoc?.postalCode ?? physLoc?.zip ?? '').trim(),
        mailingAddress: mailingFull,
        powerUnits,
        drivers,
        mcs150Date,
        mcs150Mileage,
        businessType,
        outOfService,
        sourceUrl: sourceUrl || `https://motus.dot.gov/public/search?q=${dotNumber}`,
        raw: data,
    };
}