import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

// Define types for SkillRecord and SkillPayload
type SkillRecord = Record<{
    id: string;
    skill: string;
    owner: string; // Representing the owner's identifier (e.g., user ID)
    verified: boolean;
    verifier: string; // Representing the verifier's identifier (e.g., organization ID)
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>

type SkillPayload = Record<{
    skill: string;
    owner: string;
    verifier?: string;
}>

// Create a map to store skill records
const skillStorage = new StableBTreeMap<string, SkillRecord>(0, 44, 1024);

$update;
export function addSkill(payload: SkillPayload): Result<SkillRecord, string> {
    const record: SkillRecord = { id: uuidv4(), createdAt: ic.time(), updatedAt: Opt.None, ...payload, verified: false };
    skillStorage.insert(record.id, record);
    return Result.Ok(record);
}

$update;
export function updateSkill(id: string, payload: SkillPayload): Result<SkillRecord, string> {
    return match(skillStorage.get(id), {
        Some: (record) => {
            const updatedRecord: SkillRecord = { ...record, ...payload, updatedAt: Opt.Some(ic.time()) };
            skillStorage.insert(record.id, updatedRecord);
            return Result.Ok(updatedRecord);
        },
        None: () => Result.Err<SkillRecord, string>(`Skill with id=${id} not found`)
    });
}

$update;
export function deleteSkill(id: string): Result<SkillRecord, string> {
    return match(skillStorage.remove(id), {
        Some: (deletedRecord) => Result.Ok<SkillRecord, string>(deletedRecord),
        None: () => Result.Err<SkillRecord, string>(`Skill with id=${id} not found`)
    });
}

$query;
export function getSkill(id: string): Result<SkillRecord, string> {
    return match(skillStorage.get(id), {
        Some: (record) => Result.Ok<SkillRecord, string>(record),
        None: () => Result.Err<SkillRecord, string>(`Skill with id=${id} not found`)
    });
}

$query;
export function getSkills(): Result<Vec<SkillRecord>, string> {
    return Result.Ok(skillStorage.values());
}

// Function to search skills by skill name
$query;
export function searchSkillsBySkillName(skillName: string): Result<Vec<SkillRecord>, string> {
    const records = skillStorage.values();
    const filteredSkills = records.filter(skill => skill.skill.toLowerCase().includes(skillName.toLowerCase()));
    return Result.Ok(filteredSkills);
}

// Function to filter skills by owner
$query;
export function filterSkillsByOwner(owner: string): Result<Vec<SkillRecord>, string> {
    const records = skillStorage.values();
    const filteredSkills = records.filter(skill => skill.owner === owner);
    return Result.Ok(filteredSkills);
}

// Function to verify a skill record
$update;
export function verifySkill(id: string, verifier: string): Result<SkillRecord, string> {
    return match(skillStorage.get(id), {
        Some: (record) => {
            const updatedRecord: SkillRecord = { ...record, verified: true, verifier, updatedAt: Opt.Some(ic.time()) };
            skillStorage.insert(record.id, updatedRecord);
            return Result.Ok(updatedRecord);
        },
        None: () => Result.Err<SkillRecord, string>(`Skill with id=${id} not found`)
    });
}

// Function to get the current date
function getCurrentDate() {
    return new Date(ic.time().toNumber() / 1000000);
}

// Function to get the current date
function getCurrentDate() {
    const timestamp = new Number(ic.time());
    return new Date(timestamp.valueOf() / 1000_000);
}

// A workaround to make the uuid package work with Azle
globalThis.crypto = {
    // @ts-ignore
    getRandomValues: () => {
        let array = new Uint8Array(32);

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }

        return array;
    },
};
