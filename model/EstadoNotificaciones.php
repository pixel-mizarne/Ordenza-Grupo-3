<?php
    namespace enumNotificaciones;

    enum EstadoNotificaciones: string {
        case PENDIENTE = 'PENDIENTE';
        case REALIZADA = 'REALIZADA';
        case EN_PROCESO = 'EN_PROCESO';
    }
?>