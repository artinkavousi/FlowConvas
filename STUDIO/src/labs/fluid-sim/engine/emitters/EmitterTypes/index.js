// EmitterTypes index — single import that registers every built-in shape.

import './PointType.js';
import './LineType.js';
import './RadialType.js';
import './AreaType.js';
import './SplineType.js';
import './BrushType.js';
import './VectorType.js';
import './SvgType.js';
import './TextType.js';
import './ImageType.js';
import './HeatType.js';
import './WindType.js';
import './AttractorType.js';

export {
    registerType, getType, hasType,
    getAllTypes, getTypeIds, getTypeOptions
} from './_registry.js';
