import { CreateResourceDto } from './create-resource.dto';

// Make all fields optional for updates
export class UpdateResourceDto implements Partial<CreateResourceDto> {}
