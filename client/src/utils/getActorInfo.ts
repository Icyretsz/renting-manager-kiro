import { MeterReading } from "@/types";

// Helper function to get the correct actor information based on modification type
const getActorInfo = (mod: any, reading: MeterReading) => {
  switch (mod.modificationType.toLowerCase()) {
    case 'approve':
      // For approve actions, use the approver information
      return reading.approver ? {
        name: reading.approver.tenant?.name || reading.approver.name,
        role: reading.approver.role,
        roomId: reading.approver.tenant?.roomId
      } : { name: 'Unknown', role: 'Unknown', roomId: null };
    
    case 'reject':
      // For reject actions, we might need to look at who rejected it
      // This could be stored in the modifier or we might need additional logic
      return mod.modifier ? {
        name: mod.modifier.tenant?.name || mod.modifier.name,
        role: mod.modifier.role,
        roomId: mod.modifier.tenant?.roomId
      } : { name: 'Unknown', role: 'Unknown', roomId: null };
    
    case 'create':
      // For create actions, use the submitter information
      return reading.submitter ? {
        name: reading.submitter.tenant?.name || reading.submitter.name,
        role: reading.submitter.role,
        roomId: reading.submitter.tenant?.roomId
      } : { name: 'Unknown', role: 'Unknown', roomId: null };
    
    default:
      // For update and other actions, use the modifier information
      return mod.modifier ? {
        name: mod.modifier.tenant?.name || mod.modifier.name,
        role: mod.modifier.role,
        roomId: mod.modifier.tenant?.roomId
      } : { name: 'Unknown', role: 'Unknown', roomId: null };
  }
};

export default getActorInfo