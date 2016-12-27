var arranger = (function() {

    var _options = {
        anchorInterval: 0.2
    };

    var states = {};
    var transitionEndpoints = [];
    var transitions = [];

    return {
        calculate: function() {
            transitionEndpoints = getTransitionEndpoints();
            resetStateAnchors();
            addStateAnchors();
            sortStateAnchors();
            calculateOffsets();
            return this;
        },
        initialize: function(options) {
            states = getStates(options.stateSelector);
            transitions = options.transitions;
            return this;
        },
        getTransitionAnchor: function(index) {
            return getAnchors(index);
        }
    };

    function addStateAnchors() {
        transitionEndpoints.forEach(function(endpoint, i) {
            var transition = transitions[i];

            var sourceState = states[transition.source];
            var targetState = states[transition.target];

            sourceState.anchors[endpoint.start.face].push(new StateAnchor({
                stateId: targetState.id,
                transitionId: i
            }));

            if (transition.source !== transition.target) {
                // only add target anchor if not self-referencing
                targetState.anchors[endpoint.end.face].push(new StateAnchor({
                    stateId: sourceState.id,
                    transitionId: i
                }));
            }
        });
    }

    function calculateOffset(stateId, transitionId, face) {
        var state = states[stateId];
        var transitionCount = state.anchors.length(face);
        var transitionIndex = state.anchors.getIndex(face, transitionId);

        // nth interval - start point
        return (_options.anchorInterval * transitionIndex) -
               (((transitionCount - 1) * _options.anchorInterval) / 2);
    }

    function calculateOffsets() {
        transitionEndpoints.forEach(function(transitionEndpoint, i) {
            var transition = transitions[i];

            transitionEndpoint.start.offset = calculateOffset(transition.source, i, transitionEndpoint.start.face);
            transitionEndpoint.end.offset = calculateOffset(transition.target, i, transitionEndpoint.end.face);
        });
    }

    function getAnchor(endpoint) {
        var face = endpoint.face;
        var offset = 0.5 + endpoint.offset;
        if (face === 'top') {
            return [offset, 0, 0, -1];
        }
        if (face === 'right') {
            return [1, offset, 1, 0];
        }
        if (face === 'bottom') {
            return [offset, 1, 0, 1];
        }
        if (face === 'left') {
            return [0, offset, -1, 0];
        }

        return null;
    }

    function getAnchors(transitionId) {
        var transitionEndpoint = transitionEndpoints[transitionId];

        var startAnchor = getAnchor(transitionEndpoint.start);
        var endAnchor = getAnchor(transitionEndpoint.end);
        return [startAnchor, endAnchor];
    }

    function getStates(selector) {
        var states = {};
        $(selector).each(function() {
            var state = new State($(this));
            states[state.id] = state;
        });
        return states;
    }

    function getTransitionEndpoints() {
        var endpoints = [];
        transitions.forEach(function(transition, i) {
            var sourceState = states[transition.source];
            var targetState = states[transition.target];

            var faces = {
                start: '',
                end: ''
            };

            if (sourceState.id === targetState.id) {
                // self-referencing - join T -> T
                faces.start = 'top';
                faces.end = 'top';
            } else if (sourceState.top === targetState.top) {
                // same vertical alignment - join R -> L
                // TODO: avoid collisions
                faces.start = sourceState.left < targetState.left ? 'right' : 'left';
                faces.end = sourceState.left < targetState.left ? 'left' : 'right';
            } else {
                // join T -> B
                faces.start = sourceState.top < targetState.top ? 'bottom' : 'top';
                faces.end = sourceState.top < targetState.top ? 'top' : 'bottom';
            }

            endpoints.push(new TransitionEndpoints({
                start: new Endpoint({ transitionId: i, face: faces.start }),
                end: new Endpoint({ transitionId: i, face: faces.end }),
                transitionId: i
            }));
        });
        return endpoints;
    }

    function resetStateAnchors() {
        for (var id in states) {
            if (states.hasOwnProperty(id)) {
                states[id].anchors = new Anchors();
            }
        }
    }

    function sortStateAnchors() {
        for (var id in states) {
            if (states.hasOwnProperty(id)) {
                var state = states[id];

                state.anchors.top.sort(function(a, b) {
                    return states[a.stateId].left - states[b.stateId].left;
                });
                state.anchors.right.sort(function(a, b) {
                    return states[a.stateId].top - states[b.stateId].top;
                });
                state.anchors.bottom.sort(function(a, b) {
                    return states[a.stateId].left - states[b.stateId].left;
                });
                state.anchors.left.sort(function(a, b) {
                    return states[a.stateId].top - states[b.stateId].top;
                });
            }
        }
    }

    // classes
    function Anchors() {
        var _anchors = this;

        this.top = [];
        this.right = [];
        this.bottom = [];
        this.left = [];

        this.getIndex = function(type, transitionId) {
            var array = _anchors[type];
            for (var i = 0; i < array.length; i++) {
                if (array[i].transitionId === transitionId) {
                    return i;
                }
            }
            return -1;
        };

        this.length = function(type) {
            return _anchors[type].length;
        };
    }

    function Endpoint(options) {
        this.face = options.face;
        this.offset = 0.5;
    }

    function State($el) {
        var position = $el.position();
        this.anchors = new Anchors();
        this.id = $el.attr('id');
        this.left = position.left;
        this.top = position.top;
    }

    function StateAnchor(options) {
        this.stateId = options.stateId;
        this.transitionId = options.transitionId;
    }

    function TransitionEndpoints(options) {
        this.end = options.end;
        this.start = options.start;
        this.transitionId = options.transitionId;
    }
})();